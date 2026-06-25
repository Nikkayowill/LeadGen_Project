import { createServerSupabaseClient } from "@/lib/supabase/server";
import { discoveredLeadToInsert, type DiscoveredLead, type LeadFinderSearch } from "@/lib/types/discovery";
import type {
  DiscoveredLeadInsert,
  DiscoveredLeadRow,
  DiscoveryRun,
  LeadInsert
} from "@/lib/types/database";
import { createLead } from "@/services/leads";

export async function createDiscoveryRun(input: LeadFinderSearch, leads: DiscoveredLead[]) {
  const supabase = createServerSupabaseClient();
  const freshLeads = leads.filter((lead) => !lead.isExistingLead);

  const { data: run, error: runError } = await supabase
    .from("discovery_runs")
    .insert({
      query: input.query,
      location: input.location,
      radius_miles: input.radiusMiles,
      max_results: input.maxResults,
      provider: input.provider,
      search_depth: input.searchDepth,
      quality_filter: input.qualityFilter,
      min_rating: input.minRating,
      min_reviews: input.minReviews,
      status: "completed",
      total_found: leads.length,
      fresh_count: freshLeads.length,
      dialable_count: freshLeads.filter((lead) => Boolean(lead.phone)).length,
      a_grade_count: freshLeads.filter((lead) => lead.opportunityGrade === "A").length,
      no_website_count: freshLeads.filter((lead) => !lead.hasWebsite).length
    })
    .select("*")
    .single();

  if (runError) throw new Error(runError.message);

  if (leads.length) {
    const rows = leads.map((lead): DiscoveredLeadInsert => toDiscoveredLeadInsert(run.id, lead));
    const { error: leadsError } = await supabase.from("discovered_leads").insert(rows);
    if (leadsError) throw new Error(leadsError.message);
  }

  return run;
}

export async function getDiscoveryRuns(limit = 8) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("discovery_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getDiscoveryRunById(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("discovery_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDiscoveredLeadsForRun(runId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("discovered_leads")
    .select("*")
    .eq("discovery_run_id", runId)
    .order("is_existing_lead", { ascending: true })
    .order("lead_score", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function promoteDiscoveredLead(id: string) {
  const supabase = createServerSupabaseClient();
  const { data: discoveredLead, error } = await supabase
    .from("discovered_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  if (discoveredLead.promoted_lead_id) return discoveredLead.promoted_lead_id;
  if (discoveredLead.existing_lead_id) return discoveredLead.existing_lead_id;

  const lead = await createLead(discoveredLeadRowToLeadInsert(discoveredLead));

  const { error: updateError } = await supabase
    .from("discovered_leads")
    .update({
      promoted_lead_id: lead.id,
      is_existing_lead: true,
      existing_lead_id: lead.id
    })
    .eq("id", discoveredLead.id);

  if (updateError) throw new Error(updateError.message);
  return lead.id;
}

export function discoveryRunToSearch(run: DiscoveryRun): LeadFinderSearch {
  return {
    query: run.query,
    location: run.location,
    radiusMiles: run.radius_miles,
    maxResults: run.max_results,
    provider:
      run.provider === "google_places" ||
      run.provider === "yelp" ||
      run.provider === "osm_overpass" ||
      run.provider === "auto"
        ? run.provider
        : "auto",
    searchDepth:
      run.search_depth === "focused" || run.search_depth === "deep"
        ? run.search_depth
        : "standard",
    qualityFilter:
      run.quality_filter === "call_ready" || run.quality_filter === "all"
        ? run.quality_filter
        : "reviewable",
    minRating: run.min_rating ?? 0,
    minReviews: run.min_reviews ?? 5
  };
}

export function discoveredLeadRowToDomain(row: DiscoveredLeadRow): DiscoveredLead {
  return {
    source:
      row.source === "yelp"
        ? "yelp"
        : row.source === "osm_overpass"
          ? "osm_overpass"
          : "google_places",
    sourcePlaceId: row.source_place_id,
    businessName: row.business_name,
    phone: row.phone,
    websiteUrl: row.website_url,
    industry: row.industry,
    location: row.location,
    address: row.address,
    hasWebsite: row.has_website,
    websiteQuality:
      row.website_quality === "unreachable" ||
      row.website_quality === "thin" ||
      row.website_quality === "basic" ||
      row.website_quality === "solid"
        ? row.website_quality
        : "no_website",
    websiteSignals: row.website_signals,
    conversionStrength:
      row.conversion_strength === "strong" ||
      row.conversion_strength === "moderate" ||
      row.conversion_strength === "weak"
        ? row.conversion_strength
        : "none",
    hasBookingSystem: row.has_booking_system,
    bookingSystem: row.booking_system,
    contactabilityScore: row.contactability_score,
    websiteGap:
      row.website_gap === "provider_no_website" ||
      row.website_gap === "not_listed" ||
      row.website_gap === "weak_website" ||
      row.website_gap === "healthy_website" ||
      row.website_gap === "booking_present"
        ? row.website_gap
        : "unverified",
    discoveryFit:
      row.discovery_fit === "call_now" ||
      row.discovery_fit === "review_first" ||
      row.discovery_fit === "skip"
        ? row.discovery_fit
        : "research",
    leadScore: row.lead_score,
    opportunityGrade:
      row.opportunity_grade === "A" ||
      row.opportunity_grade === "B" ||
      row.opportunity_grade === "C"
        ? row.opportunity_grade
        : "D",
    priorityLabel: row.priority_label,
    scoreReasons: row.score_reasons,
    isExistingLead: row.is_existing_lead,
    existingLeadId: row.existing_lead_id ?? row.promoted_lead_id,
    metadata: row.metadata
  };
}

function toDiscoveredLeadInsert(runId: string, lead: DiscoveredLead): DiscoveredLeadInsert {
  return {
    discovery_run_id: runId,
    source: lead.source,
    source_place_id: lead.sourcePlaceId,
    business_name: lead.businessName,
    phone: lead.phone,
    website_url: lead.websiteUrl,
    industry: lead.industry,
    location: lead.location,
    address: lead.address,
    has_website: lead.hasWebsite,
    website_quality: lead.websiteQuality,
    website_signals: lead.websiteSignals,
    conversion_strength: lead.conversionStrength,
    has_booking_system: lead.hasBookingSystem,
    booking_system: lead.bookingSystem,
    contactability_score: lead.contactabilityScore,
    website_gap: lead.websiteGap,
    discovery_fit: lead.discoveryFit,
    lead_score: lead.leadScore,
    opportunity_grade: lead.opportunityGrade,
    priority_label: lead.priorityLabel,
    score_reasons: lead.scoreReasons,
    is_existing_lead: lead.isExistingLead,
    existing_lead_id: lead.existingLeadId,
    metadata: lead.metadata
  };
}

function discoveredLeadRowToLeadInsert(row: DiscoveredLeadRow): LeadInsert {
  return discoveredLeadToInsert(discoveredLeadRowToDomain(row));
}
