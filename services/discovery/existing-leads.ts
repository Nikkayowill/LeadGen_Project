import type { DiscoveryCandidate, DiscoveredLead } from "@/lib/types/discovery";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ExistingLead = {
  id: string;
  business_name: string;
  phone: string | null;
  source: string | null;
  source_place_id: string | null;
  location: string | null;
};

export async function markExistingLeads<T extends DiscoveryCandidate | DiscoveredLead>(
  leads: T[]
) {
  const existingLeads = await getExistingLeads();

  return leads.map((lead) => {
    const match = existingLeads.find((existing) => isExistingMatch(lead, existing));
    return {
      ...lead,
      isExistingLead: Boolean(match),
      existingLeadId: match?.id ?? null
    };
  });
}

export async function findExistingLeadForDiscovery(lead: DiscoveryCandidate | DiscoveredLead) {
  const existingLeads = await getExistingLeads();
  return existingLeads.find((existing) => isExistingMatch(lead, existing)) ?? null;
}

async function getExistingLeads() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("leads")
      .select("id,business_name,phone,source,source_place_id,location");

    if (error) return [];
    return data ?? [];
  } catch {
    return [] as ExistingLead[];
  }
}

function isExistingMatch(lead: DiscoveryCandidate | DiscoveredLead, existing: ExistingLead) {
  if (
    existing.source &&
    existing.source_place_id &&
    existing.source === lead.source &&
    existing.source_place_id === lead.sourcePlaceId
  ) {
    return true;
  }

  if (lead.phone && existing.phone && normalizePhone(lead.phone) === normalizePhone(existing.phone)) {
    return true;
  }

  return (
    normalizeName(lead.businessName) === normalizeName(existing.business_name) &&
    Boolean(lead.location && existing.location) &&
    normalizeName(lead.location ?? "") === normalizeName(existing.location ?? "")
  );
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
