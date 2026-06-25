import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeadFinderSummary } from "@/components/lead-finder/lead-finder-summary";
import { StagedDiscoveredLeadsTable } from "@/components/lead-finder/staged-discovered-leads-table";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import {
  discoveredLeadRowToDomain,
  getDiscoveredLeadsForRun,
  getDiscoveryRunById
} from "@/services/discovery-runs";

type DiscoveryRunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DiscoveryRunPage({ params }: DiscoveryRunPageProps) {
  const { id } = await params;

  try {
    const [run, stagedLeads] = await Promise.all([
      getDiscoveryRunById(id),
      getDiscoveredLeadsForRun(id)
    ]);
    const domainLeads = stagedLeads.map(discoveredLeadRowToDomain);

    return (
      <div className="space-y-6">
        <PageHeader
          title={`${run.query} in ${run.location}`}
          description={`Discovery run from ${formatDate(run.created_at.slice(0, 10))}. Review staged prospects and promote the best ones into the sales pipeline.`}
          actions={
            <Button asChild variant="outline">
              <Link href="/lead-finder">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Lead finder
              </Link>
            </Button>
          }
        />

        <LeadFinderSummary leads={domainLeads} />

        <Card>
          <CardHeader>
            <CardTitle>Run details</CardTitle>
            <CardDescription>
              {run.total_found} found · {run.fresh_count} fresh · {run.dialable_count} dialable · {run.no_website_count} with no website
              <br />
              {formatLabel(run.provider)} · {run.search_depth ?? "standard"} depth · {formatLabel(run.quality_filter ?? "reviewable")} · {run.min_reviews ?? 5}+ reviews
              {(run.min_rating ?? 0) > 0 ? ` · ${run.min_rating}+ rating` : ""}
            </CardDescription>
          </CardHeader>
        </Card>

        {stagedLeads.length ? (
          <Card>
            <CardContent className="p-0">
              <StagedDiscoveredLeadsTable leads={stagedLeads} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No staged leads"
            description="This run did not store any discovered businesses."
          />
        )}
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Discovery run failed to load."} />;
  }
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}
