import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { LeadForm } from "@/components/leads/lead-form";
import { Card, CardContent } from "@/components/ui/card";
import { getLeadById } from "@/services/leads";

type EditLeadProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLeadPage({ params }: EditLeadProps) {
  const { id } = await params;

  try {
    const lead = await getLeadById(id);
    return (
      <div className="space-y-6">
        <PageHeader title="Edit lead" description={lead.business_name} />
        <Card>
          <CardContent className="p-5">
            <LeadForm lead={lead} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Lead failed to load."} />;
  }
}
