import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type PitchTemplateInsert = Database["public"]["Tables"]["pitch_templates"]["Insert"];
type PricingTemplateInsert = Database["public"]["Tables"]["pricing_templates"]["Insert"];

export async function getPitchTemplates() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pitch_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

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

export async function getPricingTemplates() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

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
