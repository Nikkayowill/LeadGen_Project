type DiscoveryGateLead = {
  businessName: string;
  phone: string | null;
  websiteUrl: string | null;
  hasWebsite: boolean;
  metadata: unknown;
};

export type DiscoveryRejectionReason =
  | "provider_website_listed"
  | "known_chain_or_franchise"
  | "branded_branch_location"
  | "toll_free_corporate_phone";

export type DiscoveryRejection = {
  reason: DiscoveryRejectionReason;
  detail: string;
};

export function getDiscoveryRejection(lead: DiscoveryGateLead): DiscoveryRejection | null {
  if (lead.websiteUrl || lead.hasWebsite) {
    return {
      reason: "provider_website_listed",
      detail: "Provider already lists a website"
    };
  }

  const chainSignal = getChainSignal(lead);
  if (chainSignal) {
    return {
      reason: "known_chain_or_franchise",
      detail: chainSignal
    };
  }

  const branchSignal = getBrandedBranchSignal(lead);
  if (branchSignal) {
    return {
      reason: "branded_branch_location",
      detail: branchSignal
    };
  }

  if (isNorthAmericanTollFreePhone(lead.phone)) {
    return {
      reason: "toll_free_corporate_phone",
      detail: "Phone number appears to be a toll-free corporate line"
    };
  }

  return null;
}

export function getChainSignal(lead: Pick<DiscoveryGateLead, "businessName" | "metadata">) {
  const name = lead.businessName.toLowerCase();
  const brand = getNestedStringMetadata(lead.metadata, "tags", "brand").toLowerCase();
  const operator = getNestedStringMetadata(lead.metadata, "tags", "operator").toLowerCase();
  const network = getNestedStringMetadata(lead.metadata, "tags", "network").toLowerCase();
  const brandWikidata = getNestedStringMetadata(lead.metadata, "tags", "brand:wikidata");
  const brandWikipedia = getNestedStringMetadata(lead.metadata, "tags", "brand:wikipedia");
  const value = `${name} ${brand} ${operator} ${network}`;

  const matchedTerm = knownChainTerms.find((term) => includesBusinessTerm(value, term));
  if (matchedTerm) return `known chain/franchise: ${matchedTerm}`;
  if (brandWikidata || brandWikipedia) return "brand registry signal";

  return null;
}

function getBrandedBranchSignal(lead: Pick<DiscoveryGateLead, "businessName" | "metadata">) {
  const brand = getNestedStringMetadata(lead.metadata, "tags", "brand");
  if (!brand) return null;

  const normalizedName = normalizeBusinessText(lead.businessName);
  const normalizedBrand = normalizeBusinessText(brand);
  const hasBranchName = /\s[-–—|]\s/.test(lead.businessName) || Boolean(getNestedStringMetadata(lead.metadata, "tags", "branch"));

  if (hasBranchName && normalizedName.includes(normalizedBrand)) {
    return `branded branch location: ${brand}`;
  }

  return null;
}

function includesBusinessTerm(value: string, term: string) {
  return normalizeBusinessText(value).includes(normalizeBusinessText(term));
}

function getNestedStringMetadata(metadata: unknown, parentKey: string, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const parent = (metadata as Record<string, unknown>)[parentKey];
  if (!parent || typeof parent !== "object" || Array.isArray(parent)) return "";
  const value = (parent as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function isNorthAmericanTollFreePhone(phone: string | null) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return false;
  return tollFreeAreaCodes.has(national.slice(0, 3));
}

function normalizeBusinessText(value: string) {
  return ` ${value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ")} `;
}

const tollFreeAreaCodes = new Set(["800", "822", "833", "844", "855", "866", "877", "888"]);

const knownChainTerms = [
  "chatters",
  "first choice hair",
  "first choice haircutters",
  "great clips",
  "supercuts",
  "magicuts",
  "walmart",
  "costco",
  "starbucks",
  "tim hortons",
  "mcdonald",
  "subway",
  "burger king",
  "kfc",
  "domino",
  "pizza hut",
  "dairy queen",
  "the home depot",
  "home depot",
  "lowe's",
  "lowes",
  "canadian tire",
  "shoppers drug mart",
  "rexall",
  "petvalu",
  "pet valu",
  "goodlife fitness",
  "orange theory",
  "orangetheory",
  "anytime fitness",
  "snap fitness",
  "midas",
  "speedy auto",
  "mr lube",
  "mr. lube",
  "jiffy lube"
];
