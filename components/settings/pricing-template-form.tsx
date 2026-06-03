"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addPricingTemplateAction } from "@/app/actions/template-actions";
import { DEFAULT_PRICING } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export function PricingTemplateForm() {
  const [state, formAction] = useActionState(addPricingTemplateAction, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="pricing-template-name">Template name</Label>
          <Input id="pricing-template-name" name="template_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="one-time-price">One-time price</Label>
          <Input
            id="one-time-price"
            name="one_time_price"
            type="number"
            defaultValue={DEFAULT_PRICING.oneTimePrice}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly-price">Monthly price</Label>
          <Input
            id="monthly-price"
            name="monthly_price"
            type="number"
            defaultValue={DEFAULT_PRICING.monthlyPrice}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" className="h-4 w-4 rounded border-input" />
        Make this the default pricing template
      </label>
      <SubmitButton>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add pricing template
      </SubmitButton>
    </form>
  );
}
