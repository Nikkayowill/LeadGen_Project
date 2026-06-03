import type { Interaction } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function InteractionList({ interactions }: { interactions: Interaction[] }) {
  if (!interactions.length) {
    return (
      <EmptyState
        title="No interactions yet"
        description="Calls, messages, demos, and notes will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => (
        <div key={interaction.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">{interaction.type}</Badge>
            <span className="text-xs text-muted-foreground">{formatDate(interaction.created_at.slice(0, 10))}</span>
          </div>
          <p className="mt-3 text-sm">{interaction.summary}</p>
        </div>
      ))}
    </div>
  );
}
