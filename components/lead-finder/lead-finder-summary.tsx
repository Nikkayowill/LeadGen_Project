import { Phone, Radar, Star, Target, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiscoveredLead } from "@/lib/types/discovery";

export function LeadFinderSummary({ leads }: { leads: DiscoveredLead[] }) {
  const freshLeads = leads.filter((lead) => !lead.isExistingLead);
  const dialable = freshLeads.filter((lead) => Boolean(lead.phone)).length;
  const callNow = freshLeads.filter((lead) => lead.discoveryFit === "call_now").length;
  const websiteGaps = freshLeads.filter((lead) =>
    ["provider_no_website", "weak_website"].includes(lead.websiteGap)
  ).length;
  const topLead = freshLeads[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard title="Fresh leads" value={freshLeads.length} icon={Radar} detail="Not already saved" />
      <SummaryCard title="Dialable" value={dialable} icon={Phone} detail="Phone number found" />
      <SummaryCard title="Call now" value={callNow} icon={Star} detail="Phone plus real website gap" />
      <SummaryCard
        title="Best next call"
        value={topLead?.businessName ?? "None"}
        icon={Target}
        detail={topLead ? `${topLead.leadScore}/100 · ${topLead.priorityLabel}` : "Try a broader search"}
      />
      {websiteGaps > 0 ? (
        <div className="rounded-sm border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-300 sm:col-span-2 xl:col-span-4">
          {websiteGaps} fresh lead{websiteGaps === 1 ? "" : "s"} have a clear website gap and no detected booking system.
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  detail
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="truncate text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
