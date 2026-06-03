"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addPitchTemplateAction } from "@/app/actions/template-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";

export function PitchTemplateForm() {
  const [state, formAction] = useActionState(addPitchTemplateAction, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pitch-template-name">Template name</Label>
          <Input id="pitch-template-name" name="template_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pitch-industry">Industry</Label>
          <Input id="pitch-industry" name="industry" placeholder="Optional" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-body">Message body</Label>
        <Textarea
          id="message-body"
          name="message_body"
          placeholder="Use placeholders like {{business_name}}, {{contact_name}}, and {{industry}}."
          required
        />
      </div>
      <SubmitButton>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add pitch template
      </SubmitButton>
    </form>
  );
}
