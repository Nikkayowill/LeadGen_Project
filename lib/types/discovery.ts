import type { Json, LeadInsert } from "@/lib/types/database";

export type DiscoveryProvider = "google_places" | "yelp" | "osm_overpass";

export type LeadFinderSearch = {
  query: string;
  location: string;
  radiusMiles: number;
  maxResults: number;
  provider: "auto" | DiscoveryProvider;
  searchDepth: "focused" | "standard" | "deep";
  qualityFilter: "call_ready" | "reviewable" | "all";
  minRating: number;
  minReviews: number;
};

export type BookingSignal = {
  system: string;
  confidence: "high" | "medium" | "low";
};

export type OpportunityGrade = "A" | "B" | "C" | "D";
export type WebsiteQuality = "no_website" | "unreachable" | "thin" | "basic" | "solid";
export type ConversionStrength = "none" | "weak" | "moderate" | "strong";
export type DiscoveryFit = "call_now" | "review_first" | "research" | "skip";
export type WebsiteGap =
  | "provider_no_website"
  | "not_listed"
  | "weak_website"
  | "unverified"
  | "healthy_website"
  | "booking_present";

export type DiscoveredLead = {
  source: DiscoveryProvider;
  sourcePlaceId: string;
  businessName: string;
  phone: string | null;
  websiteUrl: string | null;
  industry: string | null;
  location: string | null;
  address: string | null;
  hasWebsite: boolean;
  websiteQuality: WebsiteQuality;
  websiteSignals: string[];
  conversionStrength: ConversionStrength;
  hasBookingSystem: boolean;
  bookingSystem: string | null;
  contactabilityScore: number;
  websiteGap: WebsiteGap;
  discoveryFit: DiscoveryFit;
  leadScore: number;
  opportunityGrade: OpportunityGrade;
  priorityLabel: string;
  scoreReasons: string[];
  isExistingLead: boolean;
  existingLeadId: string | null;
  metadata: Json;
};

export type DiscoveryCandidate = Omit<
  DiscoveredLead,
  | "websiteQuality"
  | "websiteSignals"
  | "conversionStrength"
  | "hasBookingSystem"
  | "bookingSystem"
  | "contactabilityScore"
  | "websiteGap"
  | "discoveryFit"
  | "leadScore"
  | "opportunityGrade"
  | "priorityLabel"
  | "scoreReasons"
  | "isExistingLead"
  | "existingLeadId"
>;

export function discoveredLeadToInsert(lead: DiscoveredLead): LeadInsert {
  return {
    business_name: lead.businessName,
    phone: lead.phone,
    website_url: lead.websiteUrl,
    industry: lead.industry,
    location: lead.location ?? lead.address,
    website_status: getWebsiteStatusForLead(lead),
    lead_status: "Not Contacted",
    source: lead.source,
    source_place_id: lead.sourcePlaceId,
    has_website: lead.hasWebsite,
    has_booking_system: lead.hasBookingSystem,
    booking_system: lead.bookingSystem,
    contactability_score: lead.contactabilityScore,
    website_gap: lead.websiteGap,
    discovery_fit: lead.discoveryFit,
    lead_score: lead.leadScore,
    discovery_metadata: lead.metadata,
    notes: [
      `Discovered via ${lead.source.replace("_", " ")}.`,
      `Opportunity grade: ${lead.opportunityGrade}. Priority: ${lead.priorityLabel}.`,
      lead.websiteSignals.length ? `Website signals: ${lead.websiteSignals.join("; ")}.` : null,
      lead.scoreReasons.length ? `Lead signals: ${lead.scoreReasons.join("; ")}.` : null
    ]
      .filter(Boolean)
      .join("\n")
  };
}

function getWebsiteStatusForLead(lead: DiscoveredLead) {
  if (lead.hasWebsite) return "Unknown";
  if (lead.websiteGap === "provider_no_website") return "No Website";
  if (lead.websiteGap === "not_listed") return "Not listed";
  return "Unknown";
}
