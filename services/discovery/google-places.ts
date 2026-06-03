import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";

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

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
      "x-goog-fieldmask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types,places.businessStatus,places.googleMapsUri,places.rating,places.userRatingCount"
    },
    body: JSON.stringify({
      textQuery: `${input.query} in ${input.location}`,
      maxResultCount: input.maxResults
    }),
    cache: "no-store"
  });

  const payload = (await response.json()) as GooglePlacesResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Google Places search failed.");
  }

  return (payload.places ?? [])
    .filter((place) => place.businessStatus !== "CLOSED_PERMANENTLY")
    .map((place) => ({
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
        reviewCount: place.userRatingCount ?? null
      }
    }));
}

function normalizeUrl(value: string | undefined) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}
