import { Archive } from "lucide-react";
import { saveDiscoveryRunAction } from "@/app/actions/discovery-actions";
import { Button } from "@/components/ui/button";
import type { DiscoveredLead, LeadFinderSearch } from "@/lib/types/discovery";

export function SaveDiscoveryRunButton({
  search,
  leads
}: {
  search: LeadFinderSearch;
  leads: DiscoveredLead[];
}) {
  return (
    <form action={saveDiscoveryRunAction}>
      <input type="hidden" name="search" value={JSON.stringify(search)} />
      <input type="hidden" name="leads" value={JSON.stringify(leads)} />
      <Button type="submit" variant="outline">
        <Archive className="h-4 w-4" aria-hidden="true" />
        Save as run
      </Button>
    </form>
  );
}
