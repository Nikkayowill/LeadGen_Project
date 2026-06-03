import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function LeadSearchForm({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const getValue = (key: string, fallback = "") => {
    const value = searchParams[key];
    return typeof value === "string" ? value : fallback;
  };

  return (
    <form className="grid gap-3 rounded-lg border bg-card p-4 lg:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.8fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="query">Business type</Label>
        <Input
          id="query"
          name="query"
          defaultValue={getValue("query")}
          placeholder="dentists, salons, restaurants"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={getValue("location")}
          placeholder="Halifax, NS"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="radiusMiles">Radius</Label>
        <Input
          id="radiusMiles"
          name="radiusMiles"
          type="number"
          min="1"
          max="25"
          defaultValue={getValue("radiusMiles", "10")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxResults">Results</Label>
        <Input
          id="maxResults"
          name="maxResults"
          type="number"
          min="1"
          max="20"
          defaultValue={getValue("maxResults", "10")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select id="provider" name="provider" defaultValue={getValue("provider", "auto")}>
          <option value="auto">Auto</option>
          <option value="google_places">Google Places</option>
          <option value="yelp">Yelp</option>
        </Select>
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full lg:w-auto">
          <Search className="h-4 w-4" aria-hidden="true" />
          Find
        </Button>
      </div>
    </form>
  );
}
