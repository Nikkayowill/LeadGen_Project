import { AlertCircle } from "lucide-react";
import { DiscoveredLeadsTable } from "@/components/lead-finder/discovered-leads-table";
import { LeadFinderSummary } from "@/components/lead-finder/lead-finder-summary";
import { LeadSearchForm } from "@/components/lead-finder/lead-search-form";
import { RecentDiscoveryRuns } from "@/components/lead-finder/recent-discovery-runs";
import { SaveDiscoveryRunButton } from "@/components/lead-finder/save-discovery-run-button";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { LeadFinderSearch } from "@/lib/types/discovery";
import { findLeadsOnline } from "@/services/discovery";
import { getDiscoveryRuns } from "@/services/discovery-runs";

type LeadFinderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadFinderPage({ searchParams }: LeadFinderPageProps) {
  const params = await searchParams;
  const input = parseSearch(params);
  const hasSearch = Boolean(input.query && input.location);
  const providersConfigured = {
    osm: true,
    google: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    yelp: Boolean(process.env.YELP_API_KEY)
  };
  const defaultProvider = providersConfigured.google ? "google_places" : "auto";

  try {
    const [leads, recentRuns] = await Promise.all([
      hasSearch
        ? findLeadsOnline(input)
        : Promise.resolve([]),
      getDiscoveryRuns()
    ]);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Lead finder"
          description="Build a practical calling list from local businesses with phone numbers, real website gaps, and no detected booking system."
        />

        <LeadSearchForm searchParams={params} defaultProvider={defaultProvider} />

        {!providersConfigured.google && !providersConfigured.yelp ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                Using free discovery
              </CardTitle>
              <CardDescription>
                OpenStreetMap is available without API keys. Google quality mode uses your paid Places limit and creates stronger calling matches.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Badge variant="success">OpenStreetMap ready</Badge>
          <Badge variant={providersConfigured.google ? "success" : "secondary"}>
            Google Places {providersConfigured.google ? "quality mode" : "not configured"}
          </Badge>
          <Badge variant={providersConfigured.yelp ? "success" : "secondary"}>
            Yelp {providersConfigured.yelp ? "limited" : "not configured"}
          </Badge>
          <Badge variant="info">Solved websites hidden</Badge>
        </div>

        {hasSearch ? (
          leads.length ? (
            <div className="space-y-4">
              <LeadFinderSummary leads={leads} />
              <div className="flex justify-end">
                <SaveDiscoveryRunButton search={input} leads={leads} />
              </div>
              <Card>
                <CardContent className="p-0">
                  <DiscoveredLeadsTable leads={leads} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="No leads found"
              description="Try a broader business type, a larger radius, or confirm your provider API key is active."
            />
          )
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Start with a local niche</CardTitle>
              <CardDescription>
                Good searches include salons, dentists, roofers, restaurants, gyms, med spas, cleaners, or contractors in a specific city.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Google quality mode searches multiple niche variants, dedupes results, then prioritizes dialable businesses with a real website gap. Strong sites, booking systems, and solved restaurant presences are filtered out of the live list.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dialing note</CardTitle>
            <CardDescription>
              Treat this as prospect research. Check local calling rules and avoid automated dialing or mass outreach without proper consent.
            </CardDescription>
          </CardHeader>
        </Card>

        <RecentDiscoveryRuns runs={recentRuns} />
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Lead finder failed to load."} />;
  }
}

function parseSearch(params: Record<string, string | string[] | undefined>): LeadFinderSearch {
  const value = (key: string, fallback = "") => {
    const raw = params[key];
    return typeof raw === "string" ? raw : fallback;
  };

  const provider = value("provider", process.env.GOOGLE_PLACES_API_KEY ? "google_places" : "auto");
  const searchDepth = value("searchDepth", "standard");
  const qualityFilter = value("qualityFilter", "reviewable");

  return {
    query: value("query").trim(),
    location: value("location").trim(),
    radiusMiles: clampNumber(value("radiusMiles", "10"), 1, 25, 10),
    maxResults: clampNumber(value("maxResults", "10"), 1, 20, 10),
    provider:
      provider === "google_places" || provider === "yelp" || provider === "osm_overpass" || provider === "auto"
        ? provider
        : "auto",
    searchDepth:
      searchDepth === "focused" || searchDepth === "standard" || searchDepth === "deep"
        ? searchDepth
        : "standard",
    qualityFilter:
      qualityFilter === "call_ready" || qualityFilter === "reviewable" || qualityFilter === "all"
        ? qualityFilter
        : "reviewable",
    minReviews: clampNumber(value("minReviews", "5"), 0, 500, 5),
    minRating: clampDecimal(value("minRating", "0"), 0, 5, 0)
  };
}

function clampNumber(value: string, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function clampDecimal(value: string, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
