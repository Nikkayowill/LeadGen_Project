import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTodayDate } from "@/lib/utils";
import { getLeadPotentialRevenue, type LeadTableLead } from "@/services/leads";

const leadTableColumns = [
  "id",
  "business_name",
  "location",
  "lead_status",
  "website_status",
  "industry",
  "next_follow_up",
  "lead_score",
  "quoted_price",
  "monthly_fee"
].join(",");

async function getDashboardStatsUncached() {
  const supabase = createServerSupabaseClient();
  const today = getTodayDate();
  const countOptions = { count: "exact" as const, head: true };

  const [
    totalLeads,
    followUpsDue,
    demosBooked,
    wonDeals,
    revenueRows,
    recentLeads
  ] = await Promise.all([
    supabase.from("leads").select("id", countOptions),
    supabase
      .from("leads")
      .select("id", countOptions)
      .lte("next_follow_up", today)
      .neq("lead_status", "Won")
      .neq("lead_status", "Lost"),
    supabase.from("leads").select("id", countOptions).eq("lead_status", "Demo Booked"),
    supabase.from("leads").select("id", countOptions).eq("lead_status", "Won"),
    supabase
      .from("leads")
      .select("lead_status,quoted_price,monthly_fee")
      .neq("lead_status", "Won")
      .neq("lead_status", "Lost")
      .limit(1000),
    supabase
      .from("leads")
      .select(leadTableColumns)
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const activeRevenueLeads = (revenueRows.data ?? []).map((lead) => ({
    quoted_price: lead.quoted_price,
    monthly_fee: lead.monthly_fee
  }));

  return {
    totalLeads: totalLeads.count ?? 0,
    followUpsDue: followUpsDue.count ?? 0,
    demosBooked: demosBooked.count ?? 0,
    wonDeals: wonDeals.count ?? 0,
    potentialRevenue: getLeadPotentialRevenue(activeRevenueLeads),
    recentLeads: (recentLeads.data ?? []) as unknown as LeadTableLead[]
  };
}

export const getDashboardStats = unstable_cache(getDashboardStatsUncached, ["dashboard:stats"], {
  tags: ["leads"],
  revalidate: 30
});
