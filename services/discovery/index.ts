import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";
import { enrichWebsite } from "@/services/discovery/enrichment";
import { markExistingLeads } from "@/services/discovery/existing-leads";
import { searchGooglePlaces } from "@/services/discovery/google-places";
import { searchOpenStreetMap } from "@/services/discovery/openstreetmap";
import { paidAutoFallbackEnabled } from "@/services/discovery/provider-limits";
import { scoreDiscoveredLead } from "@/services/discovery/scoring";
import { searchYelp } from "@/services/discovery/yelp";

export async function findLeadsOnline(input: LeadFinderSearch) {
  const baseResults = await searchProviders(input);
  const deduped = dedupeResults(baseResults);
  const enrichmentLimit = Math.min(Math.max(input.maxResults * 3, input.maxResults), 60);
  const enriched = await Promise.all(
    deduped.slice(0, enrichmentLimit).map(async (lead) => {
      const website = await enrichWebsite(lead.websiteUrl);
      const enrichedLead = {
        ...lead,
        hasWebsite: website.hasWebsite,
        websiteQuality: website.websiteQuality,
        websiteSignals: website.websiteSignals,
        conversionStrength: website.conversionStrength,
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

  return withExistingMatches
    .filter((lead) => lead.discoveryFit !== "skip")
    .filter((lead) => passesQualityFilter(lead.discoveryFit, input.qualityFilter))
    .sort((a, b) => {
      if (a.isExistingLead !== b.isExistingLead) return a.isExistingLead ? 1 : -1;
      if (a.discoveryFit !== b.discoveryFit) return getFitRank(b.discoveryFit) - getFitRank(a.discoveryFit);
      if (Boolean(a.phone) !== Boolean(b.phone)) return a.phone ? -1 : 1;
      return b.leadScore - a.leadScore;
    })
    .slice(0, input.maxResults);
}

async function searchProviders(input: LeadFinderSearch) {
  if (input.provider === "osm_overpass") return searchOpenStreetMap(input);
  if (input.provider === "google_places") return searchGooglePlaces(input);
  if (input.provider === "yelp") return searchYelp(input);

  const osmResults = await searchOpenStreetMap(input);
  if (osmResults.length) return osmResults;

  if (!paidAutoFallbackEnabled()) return [];

  const googleResults = await searchGooglePlaces(input);
  if (googleResults.length) return googleResults;
  return searchYelp(input);
}

function getFitRank(fit: string) {
  if (fit === "call_now") return 3;
  if (fit === "review_first") return 2;
  if (fit === "research") return 1;
  return 0;
}

function passesQualityFilter(fit: string, filter: LeadFinderSearch["qualityFilter"]) {
  if (filter === "all") return true;
  if (filter === "reviewable") return fit === "call_now" || fit === "review_first";
  return fit === "call_now";
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
