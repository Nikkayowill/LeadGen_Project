import Link from "next/link";
import { Edit, FileText } from "lucide-react";
import { DeleteLeadButton } from "@/components/leads/delete-lead-button";
import { InteractionForm } from "@/components/leads/interaction-form";
import { InteractionList } from "@/components/leads/interaction-list";
import { LeadStatusBadge, WebsiteStatusBadge } from "@/components/leads/status-badge";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInteractionsForLead } from "@/services/interactions";
import { getLeadById } from "@/services/leads";

type LeadDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: LeadDetailProps) {
  const { id } = await params;

  try {
    const [lead, interactions] = await Promise.all([
      getLeadById(id),
      getInteractionsForLead(id)
    ]);

    return (
      <div className="space-y-6">
        <PageHeader
          title={lead.business_name}
          description={`${lead.industry ?? "Unknown industry"} ${lead.location ? `in ${lead.location}` : ""}`}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={`/pitch-generator?leadId=${lead.id}`}>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Pitch
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/leads/${lead.id}/edit`}>
                  <Edit className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              </Button>
              <DeleteLeadButton id={lead.id} />
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Lead details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label="Contact" value={lead.contact_name} />
              <Info label="Phone" value={lead.phone} />
              <Info label="Email" value={lead.email} />
              <Info label="Facebook" value={lead.facebook_url} />
              <Info label="Instagram" value={lead.instagram_url} />
              <Info label="Website" value={lead.website_url} />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pipeline status</p>
                <LeadStatusBadge status={lead.lead_status} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Website status</p>
                <WebsiteStatusBadge status={lead.website_status} />
              </div>
              <Info label="Quoted price" value={formatCurrency(lead.quoted_price)} />
              <Info label="Monthly fee" value={formatCurrency(lead.monthly_fee)} />
              <Info label="Next follow-up" value={formatDate(lead.next_follow_up)} />
              <Info label="Discovery source" value={lead.source?.replace("_", " ")} />
              <Info label="Lead score" value={lead.lead_score ? `${lead.lead_score}/100` : "Not scored"} />
              <Info label="Booking system" value={lead.has_booking_system ? lead.booking_system : "Not detected"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {lead.notes || "No notes added yet."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <Card>
            <CardHeader>
              <CardTitle>Add interaction</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractionForm leadId={lead.id} />
            </CardContent>
          </Card>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <InteractionList interactions={interactions} />
          </section>
        </div>
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Lead failed to load."} />;
  }
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">{value || "Not set"}</p>
    </div>
  );
}
