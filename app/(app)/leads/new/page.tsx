import { PageHeader } from "@/components/layout/page-header";
import { LeadForm } from "@/components/leads/lead-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add lead" description="Capture the business, contact, pricing, and next follow-up." />
      <Card>
        <CardContent className="p-5">
          <LeadForm />
        </CardContent>
      </Card>
    </div>
  );
}
