import assert from "node:assert/strict";
import { discoveredLeadToInsert } from "../lib/types/discovery.ts";
import { mergeDuplicateResults } from "../services/discovery/candidates.ts";
import { getDiscoveryRejection } from "../services/discovery/gatekeeper.ts";
import { scoreDiscoveredLead } from "../services/discovery/scoring.ts";
import {
  candidateWebsiteMatchesBusiness,
  getLikelyWebsiteUrls
} from "../services/discovery/website-verification.ts";

const baseLead = {
  source: "google_places",
  sourcePlaceId: "test-place",
  businessName: "Test Local Salon",
  phone: "+1 902-555-0100",
  websiteUrl: null,
  industry: "hair salon",
  location: "Halifax, NS",
  address: "123 Barrington St, Halifax, NS",
  hasWebsite: false,
  websiteQuality: "no_website",
  websiteSignals: ["no website listed"],
  conversionStrength: "none",
  hasBookingSystem: false,
  bookingSystem: null,
  metadata: {
    provider: "google_places",
    rating: 4.6,
    reviewCount: 25,
    types: ["hair_care", "beauty_salon"]
  }
};

const googleNoWebsite = scoreDiscoveredLead(baseLead);
assert.equal(googleNoWebsite.websiteGap, "provider_no_website");
assert.equal(googleNoWebsite.discoveryFit, "call_now");

const yelpUnknownWebsite = scoreDiscoveredLead({
  ...baseLead,
  source: "yelp",
  metadata: {
    provider: "yelp",
    rating: 4.6,
    reviewCount: 25,
    websiteEvidence: "not_provided_by_yelp"
  }
});
assert.equal(yelpUnknownWebsite.websiteGap, "unverified");
assert.equal(yelpUnknownWebsite.discoveryFit, "research");
assert(yelpUnknownWebsite.scoreReasons.includes("Yelp does not provide business website"));

const savedYelpLead = discoveredLeadToInsert({
  ...baseLead,
  source: "yelp",
  ...yelpUnknownWebsite,
  isExistingLead: false,
  existingLeadId: null
});
assert.equal(savedYelpLead.website_status, "Unknown");

const localNoWebsiteLead = {
  ...baseLead,
  source: "osm_overpass",
  metadata: {
    provider: "osm_overpass",
    tags: {
      shop: "hairdresser"
    }
  }
};
assert.equal(getDiscoveryRejection(localNoWebsiteLead), null);

const providerWebsiteLead = {
  ...baseLead,
  websiteUrl: "https://example-salon.test",
  hasWebsite: true
};
assert.deepEqual(getDiscoveryRejection(providerWebsiteLead), {
  reason: "provider_website_listed",
  detail: "Provider already lists a website"
});

const chattersRejection = getDiscoveryRejection({
  ...baseLead,
  businessName: "Chatters Hair Salon",
  source: "osm_overpass",
  metadata: {
    provider: "osm_overpass",
    tags: {
      brand: "Chatters",
      shop: "hairdresser"
    }
  }
});
assert.equal(chattersRejection?.reason, "known_chain_or_franchise");
assert.equal(chattersRejection?.detail, "known chain/franchise: chatters");

const dermaBranchRejection = getDiscoveryRejection({
  ...baseLead,
  businessName: "DermaEnvy Skincare - Halifax",
  source: "osm_overpass",
  metadata: {
    provider: "osm_overpass",
    tags: {
      brand: "DermaEnvy Skincare",
      shop: "beauty"
    }
  }
});
assert.equal(dermaBranchRejection?.reason, "branded_branch_location");

const firstChoiceRejection = getDiscoveryRejection({
  ...baseLead,
  businessName: "First Choice Haircutters",
  source: "osm_overpass",
  metadata: {
    provider: "osm_overpass",
    tags: {
      brand: "First Choice Haircutters",
      "brand:wikidata": "Q5452622",
      shop: "hairdresser"
    }
  }
});
assert.equal(firstChoiceRejection?.reason, "known_chain_or_franchise");

const tollFreeRejection = getDiscoveryRejection({
  ...baseLead,
  phone: "+1 800 555 0100"
});
assert.equal(tollFreeRejection?.reason, "toll_free_corporate_phone");

const bensUrls = getLikelyWebsiteUrls({
  businessName: "Ben's Barbershop",
  location: "Halifax, NS"
});
assert(bensUrls.includes("https://www.bensbarbershop.ca"));
assert(bensUrls.includes("https://www.bensbarbershop.com"));

assert.equal(
  candidateWebsiteMatchesBusiness(
    {
      ...baseLead,
      businessName: "Ben's Barbershop",
      phone: "+1 902-555-0100"
    },
    "https://bensbarbershop.ca",
    "<html><title>Ben's Barbershop</title><body>Book your appointment. Call 902-555-0100.</body></html>"
  ),
  true
);

assert.equal(
  candidateWebsiteMatchesBusiness(
    {
      ...baseLead,
      businessName: "Ben's Barbershop",
      phone: "+1 902-555-0100"
    },
    "https://bensbarbershop.ca",
    "<html><body>This domain is for sale.</body></html>"
  ),
  false
);

const chainLead = scoreDiscoveredLead({
  ...baseLead,
  businessName: "Chatters",
  websiteUrl: "https://chatters.ca/location/nova-scotia/ns-halifax-nsch1",
  hasWebsite: true,
  websiteQuality: "thin",
  websiteSignals: ["weak contact CTA", "low page content"],
  metadata: {
    provider: "osm_overpass",
    tags: {
      brand: "Chatters",
      shop: "hairdresser"
    }
  }
});
assert(chainLead.leadScore <= 59);
assert(chainLead.scoreReasons.includes("chain/franchise signal"));

const mergedCandidates = mergeDuplicateResults([
  {
    source: "osm_overpass",
    sourcePlaceId: "node/1",
    businessName: "North End Hair Studio",
    phone: "+1 902 555 0199",
    websiteUrl: null,
    industry: "shop: hairdresser",
    location: "Halifax, NS",
    address: "100 Agricola St, Halifax, NS",
    hasWebsite: false,
    metadata: {
      provider: "osm_overpass",
      tags: {
        shop: "hairdresser"
      }
    }
  },
  {
    source: "google_places",
    sourcePlaceId: "places/abc",
    businessName: "North End Hair Studio Inc.",
    phone: "(902) 555-0199",
    websiteUrl: "https://northendhair.example",
    industry: "hair care",
    location: "100 Agricola Street, Halifax, NS",
    address: "100 Agricola Street, Halifax, NS",
    hasWebsite: true,
    metadata: {
      provider: "google_places",
      rating: 4.7,
      reviewCount: 42,
      types: ["hair_care"]
    }
  }
]);

assert.equal(mergedCandidates.length, 1);
assert.equal(mergedCandidates[0].source, "google_places");
assert.equal(mergedCandidates[0].phone, "(902) 555-0199");
assert.equal(mergedCandidates[0].websiteUrl, "https://northendhair.example");
assert.equal(mergedCandidates[0].hasWebsite, true);
assert(Array.isArray(mergedCandidates[0].metadata.providerMatches));

console.log("Discovery logic checks passed.");
