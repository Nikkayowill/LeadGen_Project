import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";
import { getDiscoveryRejection } from "@/services/discovery/gatekeeper";
import { geocodeLocation, type Coordinates } from "@/services/discovery/geocoding";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type QueryProfile = {
  selectors: string[];
  matchTerms?: string[];
};

const providerHeaders = {
  "user-agent": "LeadGenPipeline/0.1 local prospect research",
  accept: "application/json"
};

export async function searchOpenStreetMap(input: LeadFinderSearch): Promise<DiscoveryCandidate[]> {
  const coordinates = await geocodeLocation(input.location);
  if (!coordinates) return [];

  const profile = getQueryProfile(input.query);
  const radiusMeters = Math.min(Math.max(Math.round(input.radiusMiles * 1609.34), 1000), 40000);
  const overpassQuery = buildOverpassQuery(profile.selectors, coordinates.lat, coordinates.lon, radiusMeters, input.maxResults);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      ...providerHeaders,
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: new URLSearchParams({ data: overpassQuery }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("OpenStreetMap Overpass search failed.");
  }

  const payload = (await response.json()) as OverpassResponse;

  return (payload.elements ?? [])
    .map((element) => toDiscoveryCandidate(element, input))
    .filter((lead): lead is DiscoveryCandidate => Boolean(lead))
    .filter((lead) => matchesQueryProfile(lead, profile))
    .filter((lead) => !getDiscoveryRejection(lead))
    .sort((a, b) => getCandidateRank(b, coordinates) - getCandidateRank(a, coordinates))
    .slice(0, input.maxResults);
}

function buildOverpassQuery(
  selectors: string[],
  lat: number,
  lon: number,
  radiusMeters: number,
  maxResults: number
) {
  const selectorBlock = selectors
    .map((selector) => `${selector}${noWebsiteTagFilters}`)
    .flatMap((selector) => [
      `node(around:${radiusMeters},${lat},${lon})${selector};`,
      `way(around:${radiusMeters},${lat},${lon})${selector};`,
      `relation(around:${radiusMeters},${lat},${lon})${selector};`
    ])
    .join("\n");

  return `
[out:json][timeout:25];
(
${selectorBlock}
);
out center qt ${Math.min(Math.max(maxResults * 3, 20), 80)};
`;
}

const noWebsiteTagFilters = [
  '["website"!~"."]',
  '["contact:website"!~"."]',
  '["url"!~"."]',
  '["brand:website"!~"."]'
].join("");

function getQueryProfile(query: string): QueryProfile {
  const normalized = query.toLowerCase();

  if (matches(normalized, ["plumber", "plumbing"])) {
    return {
      selectors: ['["craft"="plumber"]', '["name"~"plumb",i]'],
      matchTerms: ["plumb"]
    };
  }
  if (matches(normalized, ["electrician", "electrical"])) {
    return {
      selectors: ['["craft"="electrician"]', '["name"~"electric",i]'],
      matchTerms: ["electric"]
    };
  }
  if (matches(normalized, ["roofer", "roofing"])) {
    return {
      selectors: ['["craft"="roofer"]', '["name"~"roof",i]'],
      matchTerms: ["roof"]
    };
  }
  if (matches(normalized, ["cleaner", "cleaning", "maid"])) {
    return {
      selectors: ['["craft"="cleaner"]', '["name"~"clean|maid|janitor",i]'],
      matchTerms: ["clean", "maid", "janitor"]
    };
  }
  if (matches(normalized, ["landscaping", "landscape", "lawn"])) {
    return {
      selectors: ['["craft"="landscaper"]', '["name"~"landscap|lawn",i]'],
      matchTerms: ["landscap", "lawn"]
    };
  }
  if (matches(normalized, ["pest", "exterminator"])) {
    return {
      selectors: ['["craft"="pest_control"]', '["name"~"pest|extermin",i]'],
      matchTerms: ["pest", "extermin"]
    };
  }
  if (matches(normalized, ["contractor", "construction", "renovation", "remodel"])) {
    return {
      selectors: [
        '["craft"~"builder|carpenter|painter|plasterer|tiler|window_construction|hvac",i]',
        '["name"~"contractor|construction|renovation|remodel|builder",i]'
      ],
      matchTerms: ["contractor", "construction", "renovation", "remodel", "builder", "carpenter"]
    };
  }
  if (matches(normalized, ["salon", "hair", "barber", "beauty"])) {
    return {
      selectors: ['["shop"="hairdresser"]', '["shop"="beauty"]', '["amenity"="spa"]'],
      matchTerms: ["hair", "beauty", "barber", "spa", "salon"]
    };
  }
  if (matches(normalized, ["dentist", "dental"])) {
    return { selectors: ['["amenity"="dentist"]'], matchTerms: ["dentist", "dental"] };
  }
  if (matches(normalized, ["doctor", "clinic", "medical"])) {
    return {
      selectors: ['["amenity"="clinic"]', '["amenity"="doctors"]'],
      matchTerms: ["clinic", "doctor", "medical"]
    };
  }
  if (matches(normalized, ["restaurant", "food", "diner"])) {
    return { selectors: ['["amenity"="restaurant"]'], matchTerms: ["restaurant", "diner", "grill", "food"] };
  }
  if (matches(normalized, ["cafe", "coffee"])) {
    return { selectors: ['["amenity"="cafe"]'], matchTerms: ["cafe", "coffee"] };
  }
  if (matches(normalized, ["bar", "pub"])) {
    return { selectors: ['["amenity"="bar"]', '["amenity"="pub"]'], matchTerms: ["bar", "pub"] };
  }
  if (matches(normalized, ["gym", "fitness"])) {
    return { selectors: ['["leisure"="fitness_centre"]'], matchTerms: ["gym", "fitness"] };
  }
  if (matches(normalized, ["repair", "mechanic", "auto"])) {
    return {
      selectors: ['["shop"="car_repair"]', '["craft"="mechanic"]'],
      matchTerms: ["repair", "mechanic", "auto", "car"]
    };
  }
  if (matches(normalized, ["pet", "veterinary", "vet"])) {
    return { selectors: ['["shop"="pet"]', '["amenity"="veterinary"]'], matchTerms: ["pet", "vet"] };
  }
  if (matches(normalized, ["law", "lawyer", "attorney"])) {
    return { selectors: ['["office"="lawyer"]'], matchTerms: ["law", "attorney"] };
  }
  if (matches(normalized, ["real estate", "realtor"])) {
    return { selectors: ['["office"="estate_agent"]'], matchTerms: ["real estate", "realtor", "estate"] };
  }
  if (matches(normalized, ["shop", "store", "retail"])) {
    return { selectors: ['["shop"]'], matchTerms: getMeaningfulTerms(normalized) };
  }

  return {
    selectors: ['["name"]["shop"]', '["name"]["amenity"]', '["name"]["office"]', '["name"]["craft"]'],
    matchTerms: getMeaningfulTerms(normalized)
  };
}

function toDiscoveryCandidate(element: OverpassElement, input: LeadFinderSearch): DiscoveryCandidate | null {
  const tags = element.tags ?? {};
  const businessName = tags.name ?? tags.operator;
  if (!businessName) return null;

  const websiteUrl = normalizeUrl(
    tags.website ??
      tags["contact:website"] ??
      tags.url ??
      tags["brand:website"]
  );
  const phone = tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? null;
  const industry = getIndustryLabel(tags) ?? input.query;
  const lat = element.lat ?? element.center?.lat ?? null;
  const lon = element.lon ?? element.center?.lon ?? null;
  const address = getAddress(tags);

  return {
    source: "osm_overpass",
    sourcePlaceId: `${element.type}/${element.id}`,
    businessName,
    phone,
    websiteUrl,
    industry,
    location: address ?? input.location,
    address,
    hasWebsite: Boolean(websiteUrl),
    metadata: {
      provider: "osm_overpass",
      osmType: element.type,
      osmId: element.id,
      lat,
      lon,
      tags
    }
  };
}

function getIndustryLabel(tags: Record<string, string>) {
  const pairs = ["amenity", "shop", "office", "craft", "leisure", "tourism"];
  const key = pairs.find((item) => tags[item]);
  return key ? `${key}: ${tags[key]}` : null;
}

function getAddress(tags: Record<string, string>) {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"]
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : null;
}

function matchesQueryProfile(lead: DiscoveryCandidate, profile: QueryProfile) {
  if (!profile.matchTerms?.length) return true;
  const tags =
    typeof lead.metadata === "object" &&
    lead.metadata &&
    !Array.isArray(lead.metadata) &&
    typeof lead.metadata.tags === "object" &&
    lead.metadata.tags &&
    !Array.isArray(lead.metadata.tags)
      ? lead.metadata.tags
      : {};

  const haystack = [
    lead.businessName,
    lead.industry,
    lead.address,
    ...Object.values(tags).filter((value): value is string => typeof value === "string")
  ]
    .join(" ")
    .toLowerCase();

  return profile.matchTerms.some((term) => haystack.includes(term));
}

function getCandidateRank(lead: DiscoveryCandidate, origin: Coordinates) {
  let score = 0;
  const distanceMiles = getDistanceMiles(lead, origin);

  if (lead.phone) score += 40;
  if (lead.websiteUrl) score += 24;
  if (lead.address) score += 18;
  if (distanceMiles !== null) score += Math.max(0, 20 - Math.round(distanceMiles));
  if (hasExplicitNoWebsiteSignal(lead)) score += 8;

  return score;
}

function getDistanceMiles(lead: DiscoveryCandidate, origin: Coordinates) {
  const metadata = lead.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const lat = metadata.lat;
  const lon = metadata.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat - origin.lat);
  const dLon = toRadians(lon - origin.lon);
  const originLat = toRadians(origin.lat);
  const candidateLat = toRadians(lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(candidateLat) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
}

function hasExplicitNoWebsiteSignal(lead: DiscoveryCandidate) {
  const metadata = lead.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const tags = metadata.tags;
  if (!tags || typeof tags !== "object" || Array.isArray(tags)) return false;
  return tags.website === "no" || tags["contact:website"] === "no";
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getMeaningfulTerms(query: string) {
  return query
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9]/g, ""))
    .filter((term) => term.length >= 4 && !["near", "local", "best", "company", "service", "services"].includes(term));
}

function normalizeUrl(value: string | undefined) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}
