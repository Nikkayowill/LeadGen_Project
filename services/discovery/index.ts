import type { DiscoveryCandidate, LeadFinderSearch } from "@/lib/types/discovery";
import { mergeDuplicateResults } from "@/services/discovery/candidates";
import { enrichWebsite } from "@/services/discovery/enrichment";
import { markExistingLeads } from "@/services/discovery/existing-leads";
import { searchGooglePlaces } from "@/services/discovery/google-places";
import { searchOpenStreetMap } from "@/services/discovery/openstreetmap";
import { paidAutoFallbackEnabled, paidProvidersEnabled } from "@/services/discovery/provider-limits";
import { scoreDiscoveredLead } from "@/services/discovery/scoring";
import { verifyUnlistedWebsite } from "@/services/discovery/website-verification";
import { searchYelp } from "@/services/discovery/yelp";

export async function findLeadsOnline(input: LeadFinderSearch) {
  const baseResults = await searchProviders(input);
  const deduped = mergeDuplicateResults(baseResults);
  const enrichmentLimit = Math.min(Math.max(input.maxResults * 3, input.maxResults), 60);
  const verifiedNoWebsiteCandidates = await rejectVerifiedWebsiteCandidates(deduped.slice(0, enrichmentLimit));
  const enriched = await Promise.all(
    verifiedNoWebsiteCandidates.map(async (lead) => {
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

async function rejectVerifiedWebsiteCandidates(candidates: DiscoveryCandidate[]) {
  return compactAsync(
    await mapWithConcurrency(candidates, 5, async (lead) => {
      if (lead.websiteUrl || lead.hasWebsite) return null;

      const verifiedWebsite = await verifyUnlistedWebsite(lead);
      if (verifiedWebsite) return null;

      return {
        ...lead,
        metadata: {
          ...(typeof lead.metadata === "object" && lead.metadata ? lead.metadata : {}),
          websiteVerification: "no_likely_domain_match"
        }
      };
    })
  );
}

async function searchProviders(input: LeadFinderSearch) {
  if (input.provider === "osm_overpass") return searchOpenStreetMap(input);
  if (input.provider === "google_places") return paidProvidersEnabled() ? searchGooglePlaces(input) : [];
  if (input.provider === "yelp") return paidProvidersEnabled() ? searchYelp(input) : [];

  const osmResults = await searchAutoProvider(() => searchOpenStreetMap(input));
  if (!paidAutoFallbackEnabled()) return osmResults;

  const googleResults = await searchAutoProvider(() => searchGooglePlaces(input));
  const blendedResults = [...googleResults, ...osmResults];
  if (googleResults.length >= input.maxResults) return blendedResults;

  const yelpResults = await searchAutoProvider(() => searchYelp(input));
  return [...blendedResults, ...yelpResults];
}

async function searchAutoProvider(search: () => Promise<DiscoveryCandidate[]>) {
  try {
    return await search();
  } catch {
    return [];
  }
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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function compactAsync<T>(items: Array<T | null>) {
  return items.filter((item): item is T => item !== null);
}
