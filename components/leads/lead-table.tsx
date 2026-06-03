import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LeadStatusBadge, WebsiteStatusBadge } from "@/components/leads/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { Lead } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Value</TableHead>
          <TableHead className="text-right">Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <div className="font-medium">{lead.business_name}</div>
              <div className="text-xs text-muted-foreground">{lead.location ?? "No location"}</div>
            </TableCell>
            <TableCell>
              <LeadStatusBadge status={lead.lead_status} />
            </TableCell>
            <TableCell>
              <WebsiteStatusBadge status={lead.website_status} />
            </TableCell>
            <TableCell>{lead.industry ?? "Unknown"}</TableCell>
            <TableCell>{formatDate(lead.next_follow_up)}</TableCell>
            <TableCell>{lead.lead_score ? `${lead.lead_score}/100` : "Not scored"}</TableCell>
            <TableCell>{formatCurrency((lead.quoted_price ?? 0) + (lead.monthly_fee ?? 0) * 12)}</TableCell>
            <TableCell className="text-right">
              <Button asChild variant="ghost" size="icon" aria-label={`Open ${lead.business_name}`}>
                <Link href={`/leads/${lead.id}`}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
