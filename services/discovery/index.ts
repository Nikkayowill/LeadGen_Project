import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";
import { enrichWebsite } from "@/services/discovery/enrichment";
import { markExistingLeads } from "@/services/discovery/existing-leads";
import { searchGooglePlaces } from "@/services/discovery/google-places";
import { scoreDiscoveredLead } from "@/services/discovery/scoring";
import { searchYelp } from "@/services/discovery/yelp";

export async function findLeadsOnline(input: LeadFinderSearch) {
  const baseResults = await searchProviders(input);
  const deduped = dedupeResults(baseResults);
  const enriched = await Promise.all(
    deduped.slice(0, input.maxResults).map(async (lead) => {
      const website = await enrichWebsite(lead.websiteUrl);
      const enrichedLead = {
        ...lead,
        hasWebsite: website.hasWebsite,
        websiteQuality: website.websiteQuality,
        websiteSignals: website.websiteSignals,
        hasBookingSystem: Boolean(website.bookingSystem),
        bookingSystem: website.bookingSystem,
        metadata: {
          ...(typeof lead.metadata === "object" && lead.metadata ? lead.metadata : {}),
          bookingSignals: website.bookingSignals
        }
      };
      const score = scoreDiscoveredLead(enrichedLead);
      return {
        ...enrichedLead,
        ...score
      };
    })
  );
  const withExistingMatches = await markExistingLeads(enriched);

  return withExistingMatches.sort((a, b) => {
    if (a.isExistingLead !== b.isExistingLead) return a.isExistingLead ? 1 : -1;
    return b.leadScore - a.leadScore;
  });
}

async function searchProviders(input: LeadFinderSearch) {
  if (input.provider === "google_places") return searchGooglePlaces(input);
  if (input.provider === "yelp") return searchYelp(input);

  const googleResults = await searchGooglePlaces(input);
  if (googleResults.length) return googleResults;
  return searchYelp(input);
}

function dedupeResults(
  results: DiscoveryCandidate[]
) {
  const seen = new Set<string>();
  return results.filter((lead) => {
    const key = `${lead.businessName.toLowerCase()}-${lead.phone ?? lead.address ?? lead.sourcePlaceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
