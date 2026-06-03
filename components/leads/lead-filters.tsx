import { Search } from "lucide-react";
import { LEAD_STATUSES, WEBSITE_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function LeadFilters({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : "";
  };

  return (
    <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-6">
      <div className="relative md:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={getValue("q")}
          placeholder="Search business name"
          className="pl-9"
        />
      </div>
      <Select name="status" defaultValue={getValue("status")}>
        <option value="">All statuses</option>
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
      <Select name="websiteStatus" defaultValue={getValue("websiteStatus")}>
        <option value="">All website statuses</option>
        {WEBSITE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
      <Select name="followUp" defaultValue={getValue("followUp")}>
        <option value="">Any follow-up date</option>
        <option value="today">Due today</option>
        <option value="overdue">Overdue</option>
        <option value="upcoming">Upcoming</option>
      </Select>
      <div className="flex gap-2 md:col-span-2">
        <Input name="industry" defaultValue={getValue("industry")} placeholder="Industry" />
        <Button type="submit" className="shrink-0">
          Filter
        </Button>
      </div>
    </form>
  );
}
