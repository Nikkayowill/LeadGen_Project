import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function LeadSearchForm({
  searchParams,
  defaultProvider = "auto"
}: {
  searchParams: Record<string, string | string[] | undefined>;
  defaultProvider?: string;
}) {
  const getValue = (key: string, fallback = "") => {
    const value = searchParams[key];
    return typeof value === "string" ? value : fallback;
  };

  return (
    <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_0.65fr_0.65fr_0.8fr_0.85fr_0.8fr_0.7fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="query">Business type</Label>
        <Input
          id="query"
          name="query"
          defaultValue={getValue("query")}
          placeholder="plumbers, salons, roofers"
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
        <Select id="provider" name="provider" defaultValue={getValue("provider", defaultProvider)}>
          <option value="auto">Auto free-only</option>
          <option value="osm_overpass">OpenStreetMap</option>
          <option value="google_places">Google quality</option>
          <option value="yelp">Yelp limited</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="searchDepth">Depth</Label>
        <Select id="searchDepth" name="searchDepth" defaultValue={getValue("searchDepth", "standard")}>
          <option value="focused">Focused</option>
          <option value="standard">Standard</option>
          <option value="deep">Deep</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="qualityFilter">Fit</Label>
        <Select id="qualityFilter" name="qualityFilter" defaultValue={getValue("qualityFilter", "reviewable")}>
          <option value="call_ready">Call ready</option>
          <option value="reviewable">Reviewable</option>
          <option value="all">All unsolved</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-1">
        <div className="space-y-2">
          <Label htmlFor="minReviews">Reviews</Label>
          <Input
            id="minReviews"
            name="minReviews"
            type="number"
            min="0"
            max="500"
            defaultValue={getValue("minReviews", "5")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minRating">Rating</Label>
          <Input
            id="minRating"
            name="minRating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            defaultValue={getValue("minRating", "0")}
          />
        </div>
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
