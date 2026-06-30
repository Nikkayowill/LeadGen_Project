import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/layout/error-state";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getFollowUpLeads } from "@/services/leads";

export default async function FollowUpsPage() {
  try {
    const due = await getFollowUpLeads();

    return (
      <div className="space-y-6">
        <PageHeader
          title="Follow-ups due"
          description="Leads needing action today or already overdue."
        />
        {due.length ? (
          <Card>
            <CardContent className="p-0">
              <LeadTable leads={due} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No follow-ups due"
            description="The queue is clear for today. Add or schedule a follow-up from a lead detail page."
            action={
              <Button asChild variant="outline">
                <Link href="/leads">View leads</Link>
              </Button>
            }
          />
        )}
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Follow-ups failed to load."} />;
  }
}
