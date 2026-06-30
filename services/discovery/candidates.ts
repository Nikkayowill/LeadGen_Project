import type { DiscoveryCandidate } from "../../lib/types/discovery";
import type { Json } from "../../lib/types/database";

export function mergeDuplicateResults(results: DiscoveryCandidate[]) {
  const merged: DiscoveryCandidate[] = [];
  const keyIndex = new Map<string, number>();

  for (const lead of results) {
    const keys = getDedupeKeys(lead);
    const existingIndex = keys.map((key) => keyIndex.get(key)).find((index) => index !== undefined);

    if (existingIndex === undefined) {
      merged.push(lead);
      for (const key of keys) keyIndex.set(key, merged.length - 1);
      continue;
    }

    merged[existingIndex] = mergeCandidates(merged[existingIndex], lead);
    for (const key of getDedupeKeys(merged[existingIndex])) keyIndex.set(key, existingIndex);
  }

  return merged.sort((a, b) => getCandidateRank(b) - getCandidateRank(a));
}

function mergeCandidates(a: DiscoveryCandidate, b: DiscoveryCandidate): DiscoveryCandidate {
  const primary = getCandidateRank(b) > getCandidateRank(a) ? b : a;
  const secondary = primary === a ? b : a;

  return {
    ...primary,
    phone: primary.phone ?? secondary.phone,
    websiteUrl: primary.websiteUrl ?? secondary.websiteUrl,
    industry: getBetterText(primary.industry, secondary.industry),
    location: getBetterText(primary.location, secondary.location),
    address: getBetterText(primary.address, secondary.address),
    hasWebsite: primary.hasWebsite || secondary.hasWebsite,
    metadata: mergeMetadata(primary, secondary)
  };
}

function getCandidateRank(lead: DiscoveryCandidate) {
  const reviewCount = getNumericMetadata(lead.metadata, "reviewCount");
  let score = 0;

  if (lead.phone) score += 40;
  if (lead.websiteUrl) score += 25;
  if (lead.address) score += 10;
  if (lead.source === "google_places") score += 12;
  if (lead.source === "yelp") score += 6;
  if (reviewCount > 0) score += Math.min(10, Math.ceil(reviewCount / 20));

  return score;
}

function getDedupeKeys(lead: DiscoveryCandidate) {
  const keys: string[] = [];
  const phone = normalizePhone(lead.phone);
  if (phone) keys.push(`phone:${phone}`);

  const host = normalizeHost(lead.websiteUrl);
  if (host) keys.push(`site:${host}`);

  const address = normalizeAddress(lead.address);
  if (address) keys.push(`business:${normalizeName(lead.businessName)}:${address}`);

  keys.push(`source:${lead.source}:${lead.sourcePlaceId}`);
  return keys;
}

function mergeMetadata(primary: DiscoveryCandidate, secondary: DiscoveryCandidate): Json {
  const primaryMetadata = asJsonRecord(primary.metadata);
  const secondaryMetadata = asJsonRecord(secondary.metadata);
  const existingMatches = Array.isArray(primaryMetadata.providerMatches)
    ? primaryMetadata.providerMatches
    : [];

  return {
    ...secondaryMetadata,
    ...primaryMetadata,
    providerMatches: [
      ...existingMatches,
      getProviderMatch(primary),
      getProviderMatch(secondary)
    ]
  };
}

function getProviderMatch(lead: DiscoveryCandidate): Json {
  return {
    source: lead.source,
    sourcePlaceId: lead.sourcePlaceId,
    phone: lead.phone,
    websiteUrl: lead.websiteUrl,
    address: lead.address
  };
}

function asJsonRecord(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function getBetterText(primary: string | null, secondary: string | null) {
  if (!primary) return secondary;
  if (!secondary) return primary;
  return primary.length >= secondary.length ? primary : secondary;
}

function normalizePhone(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 7 ? digits.slice(-10) : "";
}

function normalizeHost(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeAddress(value: string | null) {
  if (!value || !/\d/.test(value)) return "";
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

function getNumericMetadata(metadata: Json, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const value = metadata[key];
  return typeof value === "number" ? value : 0;
}
