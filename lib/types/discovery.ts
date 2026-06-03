import type { Json, LeadInsert } from "@/lib/types/database";

export type DiscoveryProvider = "google_places" | "yelp";

export type LeadFinderSearch = {
  query: string;
  location: string;
  radiusMiles: number;
  maxResults: number;
  provider: "auto" | DiscoveryProvider;
};

export type BookingSignal = {
  system: string;
  confidence: "high" | "medium" | "low";
};

export type OpportunityGrade = "A" | "B" | "C" | "D";
export type WebsiteQuality = "no_website" | "unreachable" | "thin" | "basic" | "solid";

export type DiscoveredLead = {
  source: DiscoveryProvider;
  sourcePlaceId: string;
  businessName: string;
  phone: string | null;
  websiteUrl: string | null;
  industry: string | null;
  location: string | null;
  address: string | null;
  hasWebsite: boolean;
  websiteQuality: WebsiteQuality;
  websiteSignals: string[];
  hasBookingSystem: boolean;
  bookingSystem: string | null;
  leadScore: number;
  opportunityGrade: OpportunityGrade;
  priorityLabel: string;
  scoreReasons: string[];
  isExistingLead: boolean;
  existingLeadId: string | null;
  metadata: Json;
};

export type DiscoveryCandidate = Omit<
  DiscoveredLead,
  | "websiteQuality"
  | "websiteSignals"
  | "hasBookingSystem"
  | "bookingSystem"
  | "leadScore"
  | "opportunityGrade"
  | "priorityLabel"
  | "scoreReasons"
  | "isExistingLead"
  | "existingLeadId"
>;

export function discoveredLeadToInsert(lead: DiscoveredLead): LeadInsert {
  const websiteStatus = lead.hasWebsite ? "Unknown" : "No Website";

  return {
    business_name: lead.businessName,
    phone: lead.phone,
    website_url: lead.websiteUrl,
    industry: lead.industry,
    location: lead.location ?? lead.address,
    website_status: websiteStatus,
    lead_status: "Not Contacted",
    source: lead.source,
    source_place_id: lead.sourcePlaceId,
    has_website: lead.hasWebsite,
    has_booking_system: lead.hasBookingSystem,
    booking_system: lead.bookingSystem,
    lead_score: lead.leadScore,
    discovery_metadata: lead.metadata,
    notes: [
      `Discovered via ${lead.source.replace("_", " ")}.`,
      `Opportunity grade: ${lead.opportunityGrade}. Priority: ${lead.priorityLabel}.`,
      lead.websiteSignals.length ? `Website signals: ${lead.websiteSignals.join("; ")}.` : null,
      lead.scoreReasons.length ? `Lead signals: ${lead.scoreReasons.join("; ")}.` : null
    ]
      .filter(Boolean)
      .join("\n")
  };
}
