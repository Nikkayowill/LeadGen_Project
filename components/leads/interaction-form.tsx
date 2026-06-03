"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addInteractionAction } from "@/app/actions/lead-actions";
import { INTERACTION_TYPES } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export function InteractionForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState(addInteractionAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="lead_id" value={leadId} />
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="type">Interaction type</Label>
        <Select name="type" id="type" defaultValue="Note">
          {INTERACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" name="summary" placeholder="What happened? What is the next move?" />
      </div>
      <SubmitButton>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add interaction
      </SubmitButton>
    </form>
  );
}
