import { getTodayDate } from "@/lib/utils";
import { getLeadPotentialRevenue, getLeads } from "@/services/leads";

export async function getDashboardStats() {
  const leads = await getLeads();
  const today = getTodayDate();

  const followUpsDue = leads.filter(
    (lead) => lead.next_follow_up && lead.next_follow_up <= today
  ).length;

  return {
    totalLeads: leads.length,
    followUpsDue,
    demosBooked: leads.filter((lead) => lead.lead_status === "Demo Booked").length,
    wonDeals: leads.filter((lead) => lead.lead_status === "Won").length,
    potentialRevenue: getLeadPotentialRevenue(
      leads.filter((lead) => !["Won", "Lost"].includes(lead.lead_status))
    ),
    recentLeads: leads.slice(0, 6)
  };
}
