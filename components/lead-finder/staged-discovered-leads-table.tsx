import Link from "next/link";
import { ExternalLink, Phone, Save } from "lucide-react";
import { promoteDiscoveredLeadAction } from "@/app/actions/discovery-actions";
import { WebsiteStatusBadge } from "@/components/leads/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { DiscoveredLeadRow } from "@/lib/types/database";

export function StagedDiscoveredLeadsTable({ leads }: { leads: DiscoveredLeadRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Dial</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Booking</TableHead>
          <TableHead>Signals</TableHead>
          <TableHead className="text-right">Pipeline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="min-w-56">
              <div className="font-medium">{lead.business_name}</div>
              <div className="text-xs text-muted-foreground">{lead.location ?? lead.address ?? "No address"}</div>
              <div className="mt-1 text-xs text-muted-foreground">{lead.industry ?? "Unknown industry"}</div>
              {lead.is_existing_lead || lead.promoted_lead_id ? (
                <Badge variant="info" className="mt-2">
                  In pipeline
                </Badge>
              ) : null}
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <Badge variant={gradeVariant(lead.opportunity_grade)}>Grade {lead.opportunity_grade}</Badge>
                <Badge variant={fitVariant(lead.discovery_fit)}>{fitLabel(lead.discovery_fit)}</Badge>
                <div className="text-lg font-semibold">{lead.lead_score}/100</div>
                <div className="text-xs text-muted-foreground">
                  {lead.priority_label} · {lead.contactability_score}/100 contact
                </div>
              </div>
            </TableCell>
            <TableCell>
              {lead.phone ? (
                <a className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={`tel:${lead.phone}`}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {lead.phone}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">No phone</span>
              )}
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <WebsiteStatusBadge status={websiteStatusLabel(lead)} />
                <Badge variant={gapVariant(lead.website_gap)}>{lead.website_gap.replaceAll("_", " ")}</Badge>
                <Badge variant={websiteQualityVariant(lead.website_quality)}>
                  {lead.website_quality.replace("_", " ")}
                </Badge>
                {lead.website_url ? (
                  <a
                    className="block max-w-48 truncate text-xs text-primary"
                    href={lead.website_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {lead.website_url}
                  </a>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {lead.has_booking_system ? (
                <Badge variant="success">{lead.booking_system}</Badge>
              ) : (
                <Badge variant="warning">Not detected</Badge>
              )}
            </TableCell>
            <TableCell className="min-w-64">
              <div className="flex flex-wrap gap-1">
                {[...lead.score_reasons, `conversion: ${lead.conversion_strength}`, ...lead.website_signals].slice(0, 9).map((reason, index) => (
                  <Badge key={`${reason}-${index}`} variant="secondary">
                    {reason}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {lead.promoted_lead_id || lead.existing_lead_id ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/leads/${lead.promoted_lead_id ?? lead.existing_lead_id}`}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open
                  </Link>
                </Button>
              ) : (
                <form action={promoteDiscoveredLeadAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <Button type="submit" size="sm">
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Promote
                  </Button>
                </form>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function gradeVariant(grade: string) {
  if (grade === "A") return "success";
  if (grade === "B") return "info";
  if (grade === "C") return "warning";
  return "secondary";
}

function fitVariant(fit: string) {
  if (fit === "call_now") return "success";
  if (fit === "review_first") return "warning";
  if (fit === "research") return "info";
  return "secondary";
}

function fitLabel(fit: string) {
  if (fit === "call_now") return "Call now";
  if (fit === "review_first") return "Review first";
  if (fit === "research") return "Research";
  return "Skip";
}

function gapVariant(gap: string) {
  if (gap === "provider_no_website" || gap === "weak_website") return "warning";
  if (gap === "not_listed" || gap === "unverified") return "info";
  return "secondary";
}

function websiteQualityVariant(quality: string) {
  if (quality === "unreachable") return "danger";
  if (quality === "thin" || quality === "no_website") return "warning";
  if (quality === "basic") return "info";
  return "success";
}

function websiteStatusLabel(lead: DiscoveredLeadRow) {
  if (lead.has_website) return "Unknown";
  if (lead.website_gap === "provider_no_website") return "No Website";
  if (lead.website_gap === "not_listed") return "Not listed";
  return "Unknown";
}
