import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";
import { getDiscoveryRejection } from "@/services/discovery/gatekeeper";
import { guardPaidProviderUsage, recordPaidProviderUsage } from "@/services/discovery/provider-limits";

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
  is_closed?: boolean;
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
  const usage = await guardPaidProviderUsage("yelp", input);

  const params = new URLSearchParams({
    term: input.query,
    location: input.location,
    limit: String(usage.maxResults),
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

  const results: DiscoveryCandidate[] = (payload.businesses ?? [])
    .filter((business) => !business.is_closed)
    .filter((business) => passesDemandFilters(business, input))
    .map((business): DiscoveryCandidate => ({
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
        reviewCount: business.review_count ?? null,
        websiteEvidence: "not_provided_by_yelp"
      }
    }))
    .filter((lead) => !getDiscoveryRejection(lead));

  await recordPaidProviderUsage("yelp", input, results.length);
  return results;
}

function passesDemandFilters(business: YelpBusiness, input: LeadFinderSearch) {
  const rating = business.rating ?? 0;
  const reviewCount = business.review_count ?? 0;
  if (input.minRating > 0 && rating > 0 && rating < input.minRating) return false;
  if (input.minReviews > 0 && reviewCount < input.minReviews) return false;
  return true;
}
