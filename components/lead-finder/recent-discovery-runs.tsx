import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiscoveryRun } from "@/lib/types/database";

export function RecentDiscoveryRuns({ runs }: { runs: DiscoveryRun[] }) {
  if (!runs.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent discovery runs</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {runs.map((run) => (
          <div key={run.id} className="rounded-sm border border-border bg-background/40 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {run.query} in {run.location}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {run.total_found} found · {run.fresh_count} fresh · {run.a_grade_count} A-grade
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatLabel(run.provider)} · {run.search_depth ?? "standard"} · {formatLabel(run.quality_filter ?? "reviewable")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href={`/lead-finder/runs/${run.id}`}>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Review
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}
