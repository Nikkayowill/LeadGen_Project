import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

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

const providerHeaders = {
  "user-agent": "LeadGenPipeline/0.1 local prospect research",
  accept: "application/json"
};

export async function searchOpenStreetMap(input: LeadFinderSearch): Promise<DiscoveryCandidate[]> {
  const coordinates = await geocodeLocation(input.location);
  if (!coordinates) return [];

  const selectors = getSelectorsForQuery(input.query);
  const radiusMeters = Math.min(Math.max(Math.round(input.radiusMiles * 1609.34), 1000), 40000);
  const overpassQuery = buildOverpassQuery(selectors, coordinates.lat, coordinates.lon, radiusMeters, input.maxResults);

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
    .slice(0, input.maxResults);
}

async function geocodeLocation(location: string) {
  const params = new URLSearchParams({
    q: location,
    format: "jsonv2",
    limit: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: providerHeaders,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("OpenStreetMap location lookup failed.");
  }

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];
  if (!first) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    lat,
    lon,
    label: first.display_name ?? location
  };
}

function buildOverpassQuery(
  selectors: string[],
  lat: number,
  lon: number,
  radiusMeters: number,
  maxResults: number
) {
  const selectorBlock = selectors
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

function getSelectorsForQuery(query: string) {
  const normalized = query.toLowerCase();

  if (matches(normalized, ["salon", "hair", "barber", "beauty"])) {
    return ['["shop"="hairdresser"]', '["shop"="beauty"]', '["amenity"="spa"]'];
  }
  if (matches(normalized, ["dentist", "dental"])) return ['["amenity"="dentist"]'];
  if (matches(normalized, ["doctor", "clinic", "medical"])) {
    return ['["amenity"="clinic"]', '["amenity"="doctors"]'];
  }
  if (matches(normalized, ["restaurant", "food", "diner"])) return ['["amenity"="restaurant"]'];
  if (matches(normalized, ["cafe", "coffee"])) return ['["amenity"="cafe"]'];
  if (matches(normalized, ["bar", "pub"])) return ['["amenity"="bar"]', '["amenity"="pub"]'];
  if (matches(normalized, ["gym", "fitness"])) return ['["leisure"="fitness_centre"]'];
  if (matches(normalized, ["repair", "mechanic", "auto"])) return ['["shop"="car_repair"]'];
  if (matches(normalized, ["pet", "veterinary", "vet"])) {
    return ['["shop"="pet"]', '["amenity"="veterinary"]'];
  }
  if (matches(normalized, ["law", "lawyer", "attorney"])) return ['["office"="lawyer"]'];
  if (matches(normalized, ["real estate", "realtor"])) return ['["office"="estate_agent"]'];
  if (matches(normalized, ["plumber", "electrician", "contractor", "roofer", "construction"])) {
    return ['["craft"]', '["office"="company"]'];
  }
  if (matches(normalized, ["shop", "store", "retail"])) return ['["shop"]'];

  return ['["name"]["shop"]', '["name"]["amenity"]', '["name"]["office"]', '["name"]["craft"]'];
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

function normalizeUrl(value: string | undefined) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}
