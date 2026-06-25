import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_PRICING } from "@/lib/constants";
import type { Lead, LeadInsert, LeadUpdate } from "@/lib/types/database";
import type { LeadFilters as LeadFilterInput } from "@/lib/types/domain";
import { getTodayDate } from "@/lib/utils";

export async function getLeads(filters: LeadFilterInput = {}) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

    if (filters.q) {
      query = query.ilike("business_name", `%${filters.q}%`);
    }

    if (filters.status) {
      query = query.eq("lead_status", filters.status);
    }

    if (filters.industry) {
      query = query.ilike("industry", filters.industry);
    }

    if (filters.websiteStatus) {
      query = query.eq("website_status", filters.websiteStatus);
    }

    if (filters.followUp) {
      const today = getTodayDate();
      if (filters.followUp === "today") {
        query = query.eq("next_follow_up", today);
      }
      if (filters.followUp === "overdue") {
        query = query.lt("next_follow_up", today);
      }
      if (filters.followUp === "upcoming") {
        query = query.gt("next_follow_up", today);
      }
    }

    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getLeadById(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createLead(input: LeadInsert) {
  const supabase = createServerSupabaseClient();
  const payload: LeadInsert = {
    quoted_price: DEFAULT_PRICING.oneTimePrice,
    monthly_fee: DEFAULT_PRICING.monthlyPrice,
    website_status: "Unknown",
    lead_status: "Not Contacted",
    has_website: Boolean(input.website_url),
    ...input
  };

  const { data, error } = await supabase.from("leads").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateLead(id: string, input: LeadUpdate) {
  const supabase = createServerSupabaseClient();
  const payload: LeadUpdate = {
    ...input,
    has_website:
      typeof input.website_url === "string" ? Boolean(input.website_url) : input.has_website
  };
  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLead(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function getLeadPotentialRevenue(leads: Lead[]) {
  return leads.reduce(
    (total, lead) => total + (lead.quoted_price ?? 0) + (lead.monthly_fee ?? 0) * 12,
    0
  );
}
