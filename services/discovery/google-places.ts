import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";
import { getDiscoveryRejection } from "@/services/discovery/gatekeeper";
import { geocodeLocation, type Coordinates } from "@/services/discovery/geocoding";
import { guardPaidProviderUsage, recordPaidProviderUsage } from "@/services/discovery/provider-limits";

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
  businessStatus?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
};

type GooglePlacesResponse = {
  places?: GooglePlace[];
  error?: { message?: string };
};

export async function searchGooglePlaces(
  input: LeadFinderSearch
): Promise<DiscoveryCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];
  const coordinates = await geocodeLocation(input.location);
  const searchQueries = buildSearchQueries(input, coordinates);
  const results: DiscoveryCandidate[] = [];

  for (const searchQuery of searchQueries) {
    const usage = await guardPaidProviderUsage("google_places", input);
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
        "x-goog-fieldmask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types,places.businessStatus,places.googleMapsUri,places.rating,places.userRatingCount"
      },
      body: JSON.stringify(buildRequestBody(searchQuery, input, usage.maxResults)),
      cache: "no-store"
    });

    const payload = (await response.json()) as GooglePlacesResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Google Places search failed.");
    }

    const batchResults = (payload.places ?? [])
      .filter((place) => place.businessStatus !== "CLOSED_PERMANENTLY")
      .filter((place) => !place.websiteUri)
      .filter((place) => passesDemandFilters(place, input))
      .map((place): DiscoveryCandidate => ({
        source: "google_places",
        sourcePlaceId: place.id,
        businessName: place.displayName?.text ?? "Unnamed business",
        phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
        websiteUrl: normalizeUrl(place.websiteUri),
        industry: place.types?.[0]?.replaceAll("_", " ") ?? input.query,
        location: place.formattedAddress ?? input.location,
        address: place.formattedAddress ?? null,
        hasWebsite: Boolean(place.websiteUri),
        metadata: {
          provider: "google_places",
          googleMapsUri: place.googleMapsUri ?? null,
          types: place.types ?? [],
          businessStatus: place.businessStatus ?? null,
          rating: place.rating ?? null,
          reviewCount: place.userRatingCount ?? null,
          matchedQuery: searchQuery.textQuery,
          locationBiased: Boolean(searchQuery.coordinates),
          searchLocation: coordinates?.label ?? input.location
        }
      }))
      .filter((lead) => !getDiscoveryRejection(lead));

    results.push(...batchResults);
    await recordPaidProviderUsage("google_places", input, batchResults.length, {
      matchedQuery: searchQuery.textQuery,
      locationBiased: Boolean(searchQuery.coordinates)
    });
  }

  return results;
}

function buildSearchQueries(input: LeadFinderSearch, coordinates: Coordinates | null) {
  const normalized = normalizeWhitespace(input.query);
  const variants = [normalized, ...getNicheVariants(normalized)];
  const depthCount = input.searchDepth === "deep" ? 6 : input.searchDepth === "standard" ? 3 : 1;

  return [...new Set(variants)]
    .slice(0, depthCount)
    .map((variant) => ({
      textQuery: coordinates ? variant : `${variant} in ${input.location}`,
      coordinates
    }));
}

function buildRequestBody(
  searchQuery: { textQuery: string; coordinates: Coordinates | null },
  input: LeadFinderSearch,
  resultLimit: number
) {
  const body: {
    textQuery: string;
    pageSize: number;
    includePureServiceAreaBusinesses: boolean;
    locationBias?: {
      circle: {
        center: {
          latitude: number;
          longitude: number;
        };
        radius: number;
      };
    };
  } = {
    textQuery: searchQuery.textQuery,
    pageSize: resultLimit,
    includePureServiceAreaBusinesses: true
  };

  if (searchQuery.coordinates) {
    body.locationBias = {
      circle: {
        center: {
          latitude: searchQuery.coordinates.lat,
          longitude: searchQuery.coordinates.lon
        },
        radius: Math.min(Math.max(Math.round(input.radiusMiles * 1609.34), 1000), 50000)
      }
    };
  }

  return body;
}

function getNicheVariants(query: string) {
  const lower = query.toLowerCase();

  if (matches(lower, ["plumber", "plumbing"])) {
    return ["plumbing contractor", "emergency plumber", "drain cleaning"];
  }
  if (matches(lower, ["electrician", "electrical"])) {
    return ["electrical contractor", "emergency electrician", "residential electrician"];
  }
  if (matches(lower, ["roofer", "roofing"])) {
    return ["roofing contractor", "roof repair", "roof replacement"];
  }
  if (matches(lower, ["contractor", "construction", "renovation"])) {
    return ["general contractor", "home renovation contractor", "remodeling contractor"];
  }
  if (matches(lower, ["salon", "hair", "barber", "beauty"])) {
    return ["hair salon", "beauty salon", "barber shop", "lash salon", "nail salon"];
  }
  if (matches(lower, ["med spa", "spa", "aesthetic"])) {
    return ["medical spa", "aesthetics clinic", "skin clinic"];
  }
  if (matches(lower, ["dentist", "dental"])) {
    return ["dentist", "dental clinic", "family dentist", "cosmetic dentist"];
  }
  if (matches(lower, ["doctor", "clinic", "medical"])) {
    return ["medical clinic", "walk in clinic", "family doctor"];
  }
  if (matches(lower, ["restaurant", "food", "diner"])) {
    return ["restaurant", "local restaurant", "family restaurant"];
  }
  if (matches(lower, ["cafe", "coffee"])) {
    return ["coffee shop", "cafe", "bakery cafe"];
  }
  if (matches(lower, ["cleaner", "cleaning", "maid"])) {
    return ["cleaning service", "house cleaning", "commercial cleaning"];
  }
  if (matches(lower, ["landscaping", "lawn"])) {
    return ["landscaping company", "lawn care service", "landscape contractor"];
  }
  if (matches(lower, ["pest"])) {
    return ["pest control", "exterminator", "pest control service"];
  }
  if (matches(lower, ["auto", "mechanic", "repair"])) {
    return ["auto repair shop", "mechanic", "car repair"];
  }
  if (matches(lower, ["gym", "fitness"])) {
    return ["gym", "fitness center", "personal training"];
  }

  return [`local ${query}`, `${query} service`, `${query} company`];
}

function passesDemandFilters(place: GooglePlace, input: LeadFinderSearch) {
  const rating = place.rating ?? 0;
  const reviewCount = place.userRatingCount ?? 0;
  if (input.minRating > 0 && rating > 0 && rating < input.minRating) return false;
  if (input.minReviews > 0 && reviewCount < input.minReviews) return false;
  return true;
}

function normalizeUrl(value: string | undefined) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}
