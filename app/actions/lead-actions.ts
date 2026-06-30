"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_PRICING } from "@/lib/constants";
import { createLead, deleteLead, updateLead } from "@/services/leads";
import { addInteraction } from "@/services/interactions";

export type ActionState = {
  error?: string;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function numberValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function leadPayload(formData: FormData) {
  return {
    business_name: textValue(formData, "business_name") ?? "",
    contact_name: textValue(formData, "contact_name"),
    phone: textValue(formData, "phone"),
    email: textValue(formData, "email"),
    facebook_url: textValue(formData, "facebook_url"),
    instagram_url: textValue(formData, "instagram_url"),
    website_url: textValue(formData, "website_url"),
    industry: textValue(formData, "industry"),
    location: textValue(formData, "location"),
    website_status: textValue(formData, "website_status") ?? "Unknown",
    lead_status: textValue(formData, "lead_status") ?? "Not Contacted",
    quoted_price: numberValue(formData, "quoted_price") ?? DEFAULT_PRICING.oneTimePrice,
    monthly_fee: numberValue(formData, "monthly_fee") ?? DEFAULT_PRICING.monthlyPrice,
    notes: textValue(formData, "notes"),
    next_follow_up: textValue(formData, "next_follow_up")
  };
}

export async function createLeadAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const payload = leadPayload(formData);
    if (!payload.business_name) return { error: "Business name is required." };
    const lead = await createLead(payload);
    revalidateTag("leads");
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    revalidatePath("/follow-ups");
    revalidatePath("/pitch-generator");
    redirectTo = `/leads/${lead.id}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create lead." };
  }
  redirect(redirectTo ?? "/leads");
}

export async function updateLeadAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const id = textValue(formData, "id");
    if (!id) return { error: "Lead id is missing." };
    const payload = leadPayload(formData);
    if (!payload.business_name) return { error: "Business name is required." };
    await updateLead(id, payload);
    revalidateTag("leads");
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/follow-ups");
    revalidatePath("/pitch-generator");
    redirectTo = `/leads/${id}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update lead." };
  }
  redirect(redirectTo ?? "/leads");
}

export async function deleteLeadAction(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  await deleteLead(id);
  revalidateTag("leads");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/pitch-generator");
  redirect("/leads");
}

export async function addInteractionAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const leadId = textValue(formData, "lead_id");
    const type = textValue(formData, "type") ?? "Note";
    const summary = textValue(formData, "summary");
    if (!leadId || !summary) return { error: "Interaction summary is required." };
    await addInteraction({ lead_id: leadId, type, summary });
    revalidatePath(`/leads/${leadId}`);
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add interaction." };
  }
}
