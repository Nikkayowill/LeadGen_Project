"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { discoveredLeadToInsert, type DiscoveredLead, type LeadFinderSearch } from "@/lib/types/discovery";
import { findExistingLeadForDiscovery } from "@/services/discovery/existing-leads";
import { createDiscoveryRun, promoteDiscoveredLead } from "@/services/discovery-runs";
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

  revalidateTag("leads");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/pitch-generator");
  redirect(`/leads/${lead.id}`);
}

export async function saveDiscoveryRunAction(formData: FormData) {
  const rawSearch = textValue(formData, "search");
  const rawLeads = textValue(formData, "leads");
  if (!rawSearch || !rawLeads) return;

  const search = JSON.parse(rawSearch) as LeadFinderSearch;
  const leads = JSON.parse(rawLeads) as DiscoveredLead[];
  const run = await createDiscoveryRun(search, leads);

  revalidateTag("discovery-runs");
  revalidatePath("/lead-finder");
  redirect(`/lead-finder/runs/${run.id}`);
}

export async function promoteDiscoveredLeadAction(formData: FormData) {
  const discoveredLeadId = textValue(formData, "id");
  if (!discoveredLeadId) return;

  const leadId = await promoteDiscoveredLead(discoveredLeadId);
  revalidateTag("leads");
  revalidateTag("discovery-runs");
  revalidatePath("/lead-finder");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/pitch-generator");
  redirect(`/leads/${leadId}`);
}
