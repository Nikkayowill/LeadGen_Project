import type { DiscoveredLead, OpportunityGrade, WebsiteQuality } from "@/lib/types/discovery";

type ScoreInput = Omit<
  DiscoveredLead,
  | "leadScore"
  | "opportunityGrade"
  | "priorityLabel"
  | "scoreReasons"
  | "isExistingLead"
  | "existingLeadId"
  | "hasBookingSystem"
  | "bookingSystem"
> & {
  hasBookingSystem: boolean;
  bookingSystem: string | null;
  websiteQuality: WebsiteQuality;
  websiteSignals: string[];
};

const strongLocalIndustries = [
  "beauty_salon",
  "hair_care",
  "spa",
  "restaurant",
  "dentist",
  "doctor",
  "physiotherapist",
  "plumber",
  "electrician",
  "roofing_contractor",
  "car_repair",
  "home_goods_store",
  "pet_store",
  "gym",
  "real_estate_agency",
  "lawyer"
];

export function scoreDiscoveredLead(lead: ScoreInput) {
  let score = 15;
  const reasons: string[] = [];

  if (!lead.hasWebsite) {
    score += 45;
    reasons.push("no website found");
  }

  if (lead.phone) {
    score += 20;
    reasons.push("phone number available");
  } else {
    score -= 20;
    reasons.push("no dialable phone number");
  }

  if (lead.websiteQuality === "unreachable") {
    score += 25;
    reasons.push("website could not be scanned");
  }

  if (lead.websiteQuality === "thin") {
    score += 25;
    reasons.push("thin website");
  }

  if (lead.websiteQuality === "basic") {
    score += 12;
    reasons.push("basic website");
  }

  if (lead.websiteQuality === "solid") {
    score -= 15;
    reasons.push("stronger website presence");
  }

  if (lead.hasWebsite && !lead.hasBookingSystem && lead.websiteQuality !== "solid") {
    score += 12;
    reasons.push("no booking system detected");
  }

  if (lead.hasBookingSystem) {
    score -= 25;
    reasons.push(`${lead.bookingSystem} detected`);
  }

  if (lead.websiteSignals.includes("weak contact CTA")) {
    score += 10;
    reasons.push("weak contact CTA");
  }

  if (lead.websiteSignals.includes("low page content")) {
    score += 8;
    reasons.push("low website content");
  }

  const industry = lead.industry?.toLowerCase() ?? "";
  if (strongLocalIndustries.some((type) => industry.includes(type))) {
    score += 10;
    reasons.push("strong local-service category");
  }

  const reviewCount = getNumericMetadata(lead.metadata, "reviewCount");
  if (reviewCount >= 10) {
    score += 8;
    reasons.push("established local demand");
  }

  const rating = getNumericMetadata(lead.metadata, "rating");
  if (rating >= 4.2 && reviewCount >= 5) {
    score += 5;
    reasons.push("good public reputation");
  }

  const leadScore = Math.max(0, Math.min(score, 100));
  const opportunityGrade = getOpportunityGrade(leadScore);

  return {
    leadScore,
    opportunityGrade,
    priorityLabel: getPriorityLabel(opportunityGrade, lead.phone),
    scoreReasons: reasons
  };
}

function getOpportunityGrade(score: number): OpportunityGrade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function getPriorityLabel(grade: OpportunityGrade, phone: string | null) {
  if (!phone) return "Research first";
  if (grade === "A") return "Call first";
  if (grade === "B") return "Good call";
  if (grade === "C") return "Maybe later";
  return "Low priority";
}

function getNumericMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : 0;
}
