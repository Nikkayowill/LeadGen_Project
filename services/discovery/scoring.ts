import type {
  ConversionStrength,
  DiscoveryFit,
  DiscoveredLead,
  OpportunityGrade,
  WebsiteGap,
  WebsiteQuality
} from "@/lib/types/discovery";

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
  | "contactabilityScore"
  | "websiteGap"
  | "discoveryFit"
> & {
  hasBookingSystem: boolean;
  bookingSystem: string | null;
  websiteQuality: WebsiteQuality;
  websiteSignals: string[];
  conversionStrength: ConversionStrength;
};

const strongLocalIndustries = [
  "beauty_salon",
  "beauty",
  "hair_care",
  "hairdresser",
  "spa",
  "restaurant",
  "cafe",
  "pub",
  "dentist",
  "clinic",
  "doctor",
  "physiotherapist",
  "plumber",
  "electrician",
  "craft",
  "roofing_contractor",
  "car_repair",
  "home_goods_store",
  "pet_store",
  "veterinary",
  "gym",
  "fitness_centre",
  "real_estate_agency",
  "estate_agent",
  "lawyer"
];

export function scoreDiscoveredLead(lead: ScoreInput) {
  let score = 5;
  const reasons: string[] = [];
  const provider = getStringMetadata(lead.metadata, "provider");
  const reviewCount = getNumericMetadata(lead.metadata, "reviewCount");
  const rating = getNumericMetadata(lead.metadata, "rating");
  const restaurantLike = isRestaurantLike(lead);
  const appointmentLike = isAppointmentLike(lead);
  const websiteGap = getWebsiteGap(lead, provider);
  const contactabilityScore = getContactabilityScore(lead);
  const alreadySolved = isAlreadySolved(lead, restaurantLike, reviewCount);

  score += Math.round(contactabilityScore * 0.35);

  if (!lead.hasWebsite) {
    if (provider === "osm_overpass") {
      score += 8;
      reasons.push("website not listed in OpenStreetMap");
      reasons.push("manual website check needed");
    } else {
      score += 35;
      reasons.push("no website listed by provider");
    }
  }

  if (lead.phone) {
    reasons.push("phone number available");
  } else {
    score -= 35;
    reasons.push("no dialable phone number");
  }

  if (lead.websiteQuality === "unreachable") {
    score -= 5;
    reasons.push("website scan inconclusive");
    reasons.push("manual website check needed");
  }

  if (lead.websiteQuality === "thin") {
    score += restaurantLike ? 5 : 24;
    reasons.push("thin website");
  }

  if (lead.websiteQuality === "basic") {
    score += restaurantLike ? -5 : 6;
    reasons.push("basic website");
  }

  if (lead.websiteQuality === "solid") {
    score -= 35;
    reasons.push("solid website presence");
  }

  if (
    lead.hasWebsite &&
    !lead.hasBookingSystem &&
    lead.websiteQuality !== "unreachable" &&
    lead.conversionStrength !== "strong" &&
    appointmentLike
  ) {
    score += 14;
    reasons.push("no booking system detected");
  }

  if (lead.hasWebsite && !lead.hasBookingSystem && restaurantLike) {
    reasons.push("booking not required for every restaurant");
  }

  if (lead.hasWebsite && !lead.hasBookingSystem && lead.websiteQuality === "unreachable") {
    reasons.push("booking not verified");
  }

  if (lead.hasBookingSystem) {
    score -= 45;
    reasons.push(`${lead.bookingSystem} detected`);
  }

  if (lead.conversionStrength === "strong") {
    score -= 35;
    reasons.push("strong conversion flow");
  }

  if (lead.conversionStrength === "moderate") {
    score -= 15;
    reasons.push("moderate conversion flow");
  }

  if (lead.conversionStrength === "none" && lead.hasWebsite && !restaurantLike) {
    score += 15;
    reasons.push("no clear conversion path");
  }

  if (
    lead.websiteSignals.includes("weak contact CTA") &&
    lead.conversionStrength !== "strong" &&
    !restaurantLike
  ) {
    score += 10;
    reasons.push("weak contact CTA");
  }

  if (lead.websiteSignals.includes("low page content") && !restaurantLike) {
    score += 8;
    reasons.push("low website content");
  }

  if (isStrongLocalIndustry(lead) && isRealWebsiteGap(websiteGap)) {
    score += 10;
    reasons.push("strong local-service category with website gap");
  }

  if (reviewCount >= 10 && reviewCount < 100 && isRealWebsiteGap(websiteGap) && !alreadySolved) {
    score += 6;
    reasons.push("demand but weak web presence");
  }

  if (rating >= 4.2 && reviewCount >= 5 && reviewCount < 100 && isRealWebsiteGap(websiteGap) && !alreadySolved) {
    score += 4;
    reasons.push("good reputation with website gap");
  }

  if (lead.hasWebsite && restaurantLike) {
    reasons.push("restaurant already has website");
  }

  if (reviewCount >= 100 && lead.hasWebsite) {
    reasons.push("successful business signal");
  }

  const cappedScore = getCappedScore(lead, score, provider, reviewCount, restaurantLike, alreadySolved);
  if (alreadySolved) reasons.push("already solved online");

  const leadScore = Math.max(0, Math.min(cappedScore, 100));
  const discoveryFit = getDiscoveryFit(lead, websiteGap, leadScore, alreadySolved);
  const opportunityGrade = getOpportunityGrade(leadScore, discoveryFit);

  return {
    contactabilityScore,
    websiteGap,
    discoveryFit,
    leadScore,
    opportunityGrade,
    priorityLabel: getPriorityLabel(discoveryFit, opportunityGrade, lead.phone),
    scoreReasons: reasons
  };
}

function getOpportunityGrade(score: number, fit: DiscoveryFit): OpportunityGrade {
  if (fit === "skip") return "D";
  if (fit === "research") return score >= 55 ? "C" : "D";
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function getPriorityLabel(fit: DiscoveryFit, grade: OpportunityGrade, phone: string | null) {
  if (!phone) return "Research first";
  if (fit === "skip") return "Skip for now";
  if (fit === "review_first") return "Verify then call";
  if (fit === "research") return "Research first";
  if (grade === "A") return "Call first";
  if (grade === "B") return "Review then call";
  if (grade === "C") return "Manual review";
  return "Low priority";
}

function isAlreadySolved(lead: ScoreInput, restaurantLike: boolean, reviewCount: number) {
  if (lead.hasWebsite && lead.hasBookingSystem) return true;
  if (lead.hasWebsite && lead.conversionStrength === "strong") return true;
  if (lead.hasWebsite && lead.websiteQuality === "solid") return true;
  if (lead.hasWebsite && restaurantLike && lead.conversionStrength !== "none") return true;
  if (lead.hasWebsite && reviewCount >= 100) return true;
  return false;
}

function getCappedScore(
  lead: ScoreInput,
  score: number,
  provider: string,
  reviewCount: number,
  restaurantLike: boolean,
  alreadySolved: boolean
) {
  let cappedScore = score;

  if (alreadySolved) {
    cappedScore = Math.min(cappedScore, 29);
  }

  if (lead.hasWebsite && lead.hasBookingSystem) {
    cappedScore = Math.min(cappedScore, 25);
  }

  if (lead.websiteQuality === "unreachable") {
    cappedScore = Math.min(cappedScore, 49);
  }

  if (!lead.hasWebsite && provider === "osm_overpass") {
    cappedScore = Math.min(cappedScore, 49);
  }

  if (lead.hasWebsite && lead.conversionStrength === "strong") {
    cappedScore = Math.min(cappedScore, 29);
  }

  if (lead.hasWebsite && restaurantLike) {
    cappedScore = Math.min(cappedScore, 29);
  }

  if (lead.hasWebsite && reviewCount >= 100) {
    cappedScore = Math.min(cappedScore, 29);
  }

  if (!lead.phone) {
    cappedScore = Math.min(cappedScore, 39);
  }

  return cappedScore;
}

function getDiscoveryFit(
  lead: ScoreInput,
  websiteGap: WebsiteGap,
  leadScore: number,
  alreadySolved: boolean
): DiscoveryFit {
  if (alreadySolved || websiteGap === "booking_present" || websiteGap === "healthy_website") return "skip";
  if (!lead.phone) return "research";
  if (websiteGap === "unverified") return "research";
  if (websiteGap === "not_listed") return "review_first";
  if (leadScore >= 60 && isRealWebsiteGap(websiteGap)) return "call_now";
  if (leadScore >= 40 && isRealWebsiteGap(websiteGap)) return "review_first";
  return "research";
}

function getWebsiteGap(lead: ScoreInput, provider: string): WebsiteGap {
  if (lead.hasBookingSystem) return "booking_present";
  if (!lead.hasWebsite && provider === "osm_overpass") return "not_listed";
  if (!lead.hasWebsite) return "provider_no_website";
  if (lead.websiteQuality === "unreachable") return "unverified";
  if (lead.websiteQuality === "thin" && lead.conversionStrength === "none") return "weak_website";
  if (lead.websiteQuality === "basic" && lead.conversionStrength === "none") return "weak_website";
  return "healthy_website";
}

function isRealWebsiteGap(gap: WebsiteGap) {
  return gap === "provider_no_website" || gap === "weak_website";
}

function getContactabilityScore(lead: ScoreInput) {
  let score = 0;
  if (lead.phone) score += 70;
  if (lead.websiteUrl) score += 10;
  if (lead.address || lead.location) score += 10;
  if (lead.businessName) score += 10;
  return Math.min(score, 100);
}

function isStrongLocalIndustry(lead: ScoreInput) {
  const industry = lead.industry?.toLowerCase() ?? "";
  return strongLocalIndustries.some((type) => industry.includes(type));
}

function isRestaurantLike(lead: ScoreInput) {
  const industry = lead.industry?.toLowerCase() ?? "";
  const types = getStringArrayMetadata(lead.metadata, "types").join(" ").toLowerCase();
  const value = `${industry} ${types}`;
  return ["restaurant", "bar", "grill", "pub", "cafe", "pizza", "food", "seafood", "lounge"].some((term) =>
    value.includes(term)
  );
}

function isAppointmentLike(lead: ScoreInput) {
  const industry = lead.industry?.toLowerCase() ?? "";
  const types = getStringArrayMetadata(lead.metadata, "types").join(" ").toLowerCase();
  const value = `${industry} ${types}`;

  if (isRestaurantLike(lead)) return false;

  return [
    "salon",
    "hair",
    "beauty",
    "spa",
    "dentist",
    "clinic",
    "doctor",
    "physiotherapist",
    "veterinary",
    "fitness",
    "gym",
    "lawyer",
    "estate_agent",
    "real_estate",
    "repair",
    "contractor",
    "plumber",
    "electrician"
  ].some((term) => value.includes(term));
}

function getNumericMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : 0;
}

function getStringMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function getStringArrayMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const value = (metadata as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
