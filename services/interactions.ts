import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type InteractionInsert = Database["public"]["Tables"]["interactions"]["Insert"];

export async function getInteractionsForLead(leadId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addInteraction(input: InteractionInsert) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("interactions")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
