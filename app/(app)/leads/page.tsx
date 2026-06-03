import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/layout/error-state";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getLeads } from "@/services/leads";

type LeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;

  try {
    const leads = await getLeads({
      q: typeof params.q === "string" ? params.q : undefined,
      status: typeof params.status === "string" ? params.status : undefined,
      industry: typeof params.industry === "string" ? params.industry : undefined,
      websiteStatus:
        typeof params.websiteStatus === "string" ? params.websiteStatus : undefined,
      followUp:
        params.followUp === "today" || params.followUp === "overdue" || params.followUp === "upcoming"
          ? params.followUp
          : undefined
    });

    return (
      <div className="space-y-6">
        <PageHeader
          title="Leads"
          description="Search, filter, and manage local businesses in your sales pipeline."
          actions={
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          }
        />
        <LeadFilters searchParams={params} />
        {leads.length ? (
          <Card>
            <CardContent className="p-0">
              <LeadTable leads={leads} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No matching leads"
            description="Try changing the filters or add a new business lead."
            action={
              <Button asChild>
                <Link href="/leads/new">Add lead</Link>
              </Button>
            }
          />
        )}
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Leads failed to load."} />;
  }
}
