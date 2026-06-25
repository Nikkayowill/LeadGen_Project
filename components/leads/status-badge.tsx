import { Badge } from "@/components/ui/badge";

const leadStatusVariant: Record<string, "secondary" | "info" | "warning" | "success" | "danger" | "outline"> = {
  "Not Contacted": "secondary",
  Called: "info",
  Messaged: "info",
  "Follow-Up": "warning",
  "Demo Booked": "warning",
  Won: "success",
  Lost: "danger"
};

const websiteStatusVariant: Record<string, "secondary" | "info" | "warning" | "success" | "outline"> = {
  "No Website": "warning",
  "Not listed": "secondary",
  "Outdated Website": "warning",
  "Good Website": "success",
  Unknown: "secondary"
};

export function LeadStatusBadge({ status }: { status: string }) {
  return <Badge variant={leadStatusVariant[status] ?? "outline"}>{status}</Badge>;
}

export function WebsiteStatusBadge({ status }: { status: string }) {
  return <Badge variant={websiteStatusVariant[status] ?? "outline"}>{status}</Badge>;
}
