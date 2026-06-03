import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { generatePitchMessages } from "@/lib/pitch";
import { getLeads } from "@/services/leads";

type PitchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PitchGeneratorPage({ searchParams }: PitchPageProps) {
  const params = await searchParams;
  const selectedLeadId = typeof params.leadId === "string" ? params.leadId : "";

  try {
    const leads = await getLeads();
    const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
    const messages = selectedLead ? generatePitchMessages(selectedLead) : null;

    return (
      <div className="space-y-6">
        <PageHeader
          title="Pitch generator"
          description="Generate a Facebook message, phone script, and follow-up message from lead data."
        />

        {leads.length ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Select lead</CardTitle>
                <CardDescription>Messages update from the lead&apos;s business, contact, industry, location, and pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-3 sm:flex-row">
                  <Select name="leadId" defaultValue={selectedLead?.id}>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.business_name}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit">Generate</Button>
                  {selectedLead ? (
                    <Button asChild variant="outline">
                      <Link href={`/leads/${selectedLead.id}`}>
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        Lead
                      </Link>
                    </Button>
                  ) : null}
                </form>
              </CardContent>
            </Card>

            {messages ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <PitchCard title="Facebook message" body={messages.facebook} />
                <PitchCard title="Phone script" body={messages.phone} />
                <PitchCard title="Follow-up message" body={messages.followUp} />
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="No leads to pitch"
            description="Add a lead first, then generate outreach scripts from its details."
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
    return <ErrorState message={error instanceof Error ? error.message : "Pitch generator failed to load."} />;
  }
}

function PitchCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
