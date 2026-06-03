import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";

type YelpBusiness = {
  id: string;
  name: string;
  phone?: string;
  display_phone?: string;
  url?: string;
  categories?: Array<{ alias: string; title: string }>;
  location?: {
    address1?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    display_address?: string[];
  };
  rating?: number;
  review_count?: number;
};

type YelpResponse = {
  businesses?: YelpBusiness[];
  error?: { description?: string };
};

export async function searchYelp(
  input: LeadFinderSearch
): Promise<DiscoveryCandidate[]> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    term: input.query,
    location: input.location,
    limit: String(input.maxResults),
    radius: String(Math.min(Math.round(input.radiusMiles * 1609.34), 40000))
  });

  const response = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = (await response.json()) as YelpResponse;
  if (!response.ok) {
    throw new Error(payload.error?.description ?? "Yelp search failed.");
  }

  return (payload.businesses ?? []).map((business) => ({
    source: "yelp",
    sourcePlaceId: business.id,
    businessName: business.name,
    phone: business.display_phone || business.phone || null,
    websiteUrl: null,
    industry: business.categories?.[0]?.title ?? input.query,
    location: business.location?.display_address?.join(", ") ?? input.location,
    address: business.location?.display_address?.join(", ") ?? null,
    hasWebsite: false,
    metadata: {
      provider: "yelp",
      yelpUrl: business.url ?? null,
      categories: business.categories ?? [],
      rating: business.rating ?? null,
      reviewCount: business.review_count ?? null
    }
  }));
}
