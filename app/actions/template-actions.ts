"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_PRICING } from "@/lib/constants";
import { addPitchTemplate, addPricingTemplate } from "@/services/templates";
import type { ActionState } from "@/app/actions/lead-actions";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = textValue(formData, key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function addPitchTemplateAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const templateName = textValue(formData, "template_name");
    const messageBody = textValue(formData, "message_body");
    if (!templateName || !messageBody) {
      return { error: "Template name and message are required." };
    }
    await addPitchTemplate({
      template_name: templateName,
      industry: textValue(formData, "industry"),
      message_body: messageBody
    });
    revalidatePath("/settings");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add template." };
  }
}

export async function addPricingTemplateAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const templateName = textValue(formData, "template_name");
    if (!templateName) return { error: "Template name is required." };
    await addPricingTemplate({
      template_name: templateName,
      one_time_price: numberValue(
        formData,
        "one_time_price",
        DEFAULT_PRICING.oneTimePrice
      ),
      monthly_price: numberValue(formData, "monthly_price", DEFAULT_PRICING.monthlyPrice),
      is_default: formData.get("is_default") === "on"
    });
    revalidatePath("/settings");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add pricing." };
  }
}
