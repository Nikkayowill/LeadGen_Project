import Link from "next/link";
import { ExternalLink, Phone, Save } from "lucide-react";
import { saveDiscoveredLeadAction } from "@/app/actions/discovery-actions";
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
import type { DiscoveredLead } from "@/lib/types/discovery";

export function DiscoveredLeadsTable({ leads }: { leads: DiscoveredLead[] }) {
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
          <TableHead className="text-right">Save</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={`${lead.source}-${lead.sourcePlaceId}`}>
            <TableCell className="min-w-56">
              <div className="font-medium">{lead.businessName}</div>
              <div className="text-xs text-muted-foreground">{lead.location ?? lead.address ?? "No address"}</div>
              <div className="mt-1 text-xs text-muted-foreground">{lead.industry ?? "Unknown industry"}</div>
              {lead.isExistingLead ? (
                <Badge variant="info" className="mt-2">
                  Already saved
                </Badge>
              ) : null}
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <Badge variant={gradeVariant(lead.opportunityGrade)}>
                  Grade {lead.opportunityGrade}
                </Badge>
                <div className="text-lg font-semibold">{lead.leadScore}/100</div>
                <div className="text-xs text-muted-foreground">{lead.priorityLabel}</div>
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
                <WebsiteStatusBadge status={lead.hasWebsite ? "Unknown" : "No Website"} />
                <Badge variant={websiteQualityVariant(lead.websiteQuality)}>
                  {websiteQualityLabel(lead.websiteQuality)}
                </Badge>
                {lead.websiteUrl ? (
                  <a
                    className="block max-w-48 truncate text-xs text-primary"
                    href={lead.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {lead.websiteUrl}
                  </a>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {lead.hasBookingSystem ? (
                <Badge variant="success">{lead.bookingSystem}</Badge>
              ) : (
                <Badge variant="warning">Not detected</Badge>
              )}
            </TableCell>
            <TableCell className="min-w-64">
              <div className="flex flex-wrap gap-1">
                {[...lead.scoreReasons, ...lead.websiteSignals].slice(0, 8).map((reason, index) => (
                  <Badge key={`${reason}-${index}`} variant="secondary">
                    {reason}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {lead.isExistingLead && lead.existingLeadId ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/leads/${lead.existingLeadId}`}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open
                  </Link>
                </Button>
              ) : (
                <form action={saveDiscoveredLeadAction}>
                  <input type="hidden" name="lead" value={JSON.stringify(lead)} />
                  <Button type="submit" size="sm">
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save
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

function gradeVariant(grade: DiscoveredLead["opportunityGrade"]) {
  if (grade === "A") return "success";
  if (grade === "B") return "info";
  if (grade === "C") return "warning";
  return "secondary";
}

function websiteQualityVariant(quality: DiscoveredLead["websiteQuality"]) {
  if (quality === "no_website") return "warning";
  if (quality === "unreachable") return "danger";
  if (quality === "thin") return "warning";
  if (quality === "basic") return "info";
  return "success";
}

function websiteQualityLabel(quality: DiscoveredLead["websiteQuality"]) {
  return quality.replace("_", " ");
}
