import { AlertCircle } from "lucide-react";
import { DiscoveredLeadsTable } from "@/components/lead-finder/discovered-leads-table";
import { LeadFinderSummary } from "@/components/lead-finder/lead-finder-summary";
import { LeadSearchForm } from "@/components/lead-finder/lead-search-form";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { LeadFinderSearch } from "@/lib/types/discovery";
import { findLeadsOnline } from "@/services/discovery";

type LeadFinderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadFinderPage({ searchParams }: LeadFinderPageProps) {
  const params = await searchParams;
  const input = parseSearch(params);
  const hasSearch = Boolean(input.query && input.location);
  const providersConfigured = {
    google: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    yelp: Boolean(process.env.YELP_API_KEY)
  };

  try {
    const leads =
      hasSearch && (providersConfigured.google || providersConfigured.yelp)
        ? await findLeadsOnline(input)
        : [];

    return (
      <div className="space-y-6">
        <PageHeader
          title="Lead finder"
          description="Search local businesses online, detect website and booking-system signals, then save dialable leads to the pipeline."
        />

        <LeadSearchForm searchParams={params} />

        {!providersConfigured.google && !providersConfigured.yelp ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                Add a discovery API key
              </CardTitle>
              <CardDescription>
                Add `GOOGLE_PLACES_API_KEY` or `YELP_API_KEY` to `.env.local`, then restart the dev server.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {providersConfigured.google || providersConfigured.yelp ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant={providersConfigured.google ? "success" : "secondary"}>
              Google Places {providersConfigured.google ? "ready" : "not configured"}
            </Badge>
            <Badge variant={providersConfigured.yelp ? "success" : "secondary"}>
              Yelp {providersConfigured.yelp ? "ready" : "not configured"}
            </Badge>
          </div>
        ) : null}

        {hasSearch ? (
          leads.length ? (
            <div className="space-y-4">
              <LeadFinderSummary leads={leads} />
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
                The app will prioritize businesses with phone numbers, no website, or a website without a detected booking system.
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

  const provider = value("provider", "auto");

  return {
    query: value("query").trim(),
    location: value("location").trim(),
    radiusMiles: clampNumber(value("radiusMiles", "10"), 1, 25, 10),
    maxResults: clampNumber(value("maxResults", "10"), 1, 20, 10),
    provider:
      provider === "google_places" || provider === "yelp" || provider === "auto"
        ? provider
        : "auto"
  };
}

function clampNumber(value: string, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}
