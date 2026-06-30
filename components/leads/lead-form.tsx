"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { createLeadAction, updateLeadAction } from "@/app/actions/lead-actions";
import { DEFAULT_PRICING, LEAD_STATUSES, WEBSITE_STATUSES } from "@/lib/constants";
import type { Lead } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";

export function LeadForm({ lead }: { lead?: Lead }) {
  const action = lead ? updateLeadAction : createLeadAction;
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {lead ? <input type="hidden" name="id" value={lead.id} /> : null}
      {state.error ? (
        <div className="rounded-sm border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business name" name="business_name" defaultValue={lead?.business_name} required />
        <Field label="Contact name" name="contact_name" defaultValue={lead?.contact_name} />
        <Field label="Phone" name="phone" type="tel" defaultValue={lead?.phone} />
        <Field label="Email" name="email" type="email" defaultValue={lead?.email} />
        <Field label="Facebook URL" name="facebook_url" defaultValue={lead?.facebook_url} />
        <Field label="Instagram URL" name="instagram_url" defaultValue={lead?.instagram_url} />
        <Field label="Website URL" name="website_url" defaultValue={lead?.website_url} />
        <Field label="Industry" name="industry" defaultValue={lead?.industry} />
        <Field label="Location" name="location" defaultValue={lead?.location} />
        <div className="space-y-2">
          <Label htmlFor="website_status">Website status</Label>
          <Select name="website_status" id="website_status" defaultValue={lead?.website_status ?? "Unknown"}>
            {WEBSITE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead_status">Lead status</Label>
          <Select name="lead_status" id="lead_status" defaultValue={lead?.lead_status ?? "Not Contacted"}>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <Field
          label="Quoted price"
          name="quoted_price"
          type="number"
          defaultValue={lead?.quoted_price ?? DEFAULT_PRICING.oneTimePrice}
        />
        <Field
          label="Monthly fee"
          name="monthly_fee"
          type="number"
          defaultValue={lead?.monthly_fee ?? DEFAULT_PRICING.monthlyPrice}
        />
        <Field
          label="Next follow-up"
          name="next_follow_up"
          type="date"
          defaultValue={lead?.next_follow_up}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={lead?.notes ?? ""} />
      </div>

      <div className="flex justify-end">
        <SubmitButton>
          <Save className="h-4 w-4" aria-hidden="true" />
          {lead ? "Save lead" : "Create lead"}
        </SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
    </div>
  );
}
