import { Trash2 } from "lucide-react";
import { deleteLeadAction } from "@/app/actions/lead-actions";
import { Button } from "@/components/ui/button";

export function DeleteLeadButton({ id }: { id: string }) {
  return (
    <form action={deleteLeadAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete
      </Button>
    </form>
  );
}
