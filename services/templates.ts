import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type PitchTemplateInsert = Database["public"]["Tables"]["pitch_templates"]["Insert"];
type PricingTemplateInsert = Database["public"]["Tables"]["pricing_templates"]["Insert"];

async function getPitchTemplatesUncached() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pitch_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export const getPitchTemplates = unstable_cache(getPitchTemplatesUncached, ["templates:pitch"], {
  tags: ["templates"],
  revalidate: 60
});

export async function addPitchTemplate(input: PitchTemplateInsert) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pitch_templates")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function getPricingTemplatesUncached() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pricing_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export const getPricingTemplates = unstable_cache(getPricingTemplatesUncached, ["templates:pricing"], {
  tags: ["templates"],
  revalidate: 60
});

export async function addPricingTemplate(input: PricingTemplateInsert) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_templates")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
