"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { discoveredLeadToInsert, type DiscoveredLead } from "@/lib/types/discovery";
import { findExistingLeadForDiscovery } from "@/services/discovery/existing-leads";
import { createLead } from "@/services/leads";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function saveDiscoveredLeadAction(formData: FormData) {
  const rawLead = textValue(formData, "lead");
  if (!rawLead) return;

  const discoveredLead = JSON.parse(rawLead) as DiscoveredLead;
  const existingLead = await findExistingLeadForDiscovery(discoveredLead);
  if (existingLead) {
    redirect(`/leads/${existingLead.id}`);
  }

  const lead = await createLead(discoveredLeadToInsert(discoveredLead));

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads/${lead.id}`);
}
