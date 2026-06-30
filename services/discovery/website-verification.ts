type VerificationLead = {
  businessName: string;
  phone: string | null;
  address: string | null;
  location: string | null;
};

type VerifiedWebsite = {
  url: string;
  evidence: string;
};

type SearchResult = {
  title: string;
  url: string;
  description: string;
};

type FetchResult = {
  url: string;
  html: string;
};

const verificationCache = new Map<string, Promise<VerifiedWebsite | null>>();
const defaultTimeoutMs = 1800;

export async function verifyUnlistedWebsite(lead: VerificationLead): Promise<VerifiedWebsite | null> {
  const urls = getLikelyWebsiteUrls(lead).slice(0, 8);
  if (!urls.length) return null;

  const cacheKey = urls.join("|");
  const cached = verificationCache.get(cacheKey);
  if (cached) return cached;

  const verification = Promise.all(urls.map((url) => fetchCandidateWebsite(url, defaultTimeoutMs))).then(async (results) => {
    for (const result of results) {
      if (result && candidateWebsiteMatchesBusiness(lead, result.url, result.html)) {
        return {
          url: result.url,
          evidence: "likely domain matched business name or phone"
        };
      }
    }

    return searchForOfficialPresence(lead);
  });

  verificationCache.set(cacheKey, verification);
  return verification;
}

export function getLikelyWebsiteUrls(lead: Pick<VerificationLead, "businessName" | "location">) {
  const variants = getBusinessNameVariants(lead);
  const tlds = isCanadianLead(lead.location) ? ["ca", "com"] : ["com", "ca"];
  const urls: string[] = [];

  for (const variant of variants) {
    for (const tld of tlds) {
      const domain = `${variant}.${tld}`;
      urls.push(`https://www.${domain}`, `https://${domain}`);
    }
  }

  return [...new Set(urls)];
}

export function candidateWebsiteMatchesBusiness(lead: VerificationLead, websiteUrl: string, html: string) {
  if (isParkedDomain(html)) return false;

  const text = stripHtml(html).toLowerCase();
  const compactText = compact(text);
  const host = getCompactHost(websiteUrl);
  const tokens = getDistinctiveTokens(lead);
  const compactName = compact(tokens.join(""));
  const brandName = compact(tokens.filter((token) => !genericBusinessTerms.has(token)).join(""));
  const phoneDigits = getPhoneDigits(lead.phone);

  if (compactName.length >= 8 && compactText.includes(compactName)) return true;
  if (brandName.length >= 7 && compactText.includes(brandName)) return true;
  if (compactName.length >= 8 && host.includes(compactName) && hasTokenEvidence(tokens, text)) return true;
  if (brandName.length >= 7 && host.includes(brandName) && hasTokenEvidence(tokens, text)) return true;
  if (phoneDigits && compactText.includes(phoneDigits.slice(-7)) && hasTokenEvidence(tokens, text)) return true;

  return false;
}

async function fetchCandidateWebsite(url: string, timeoutMs: number): Promise<FetchResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "LeadFinderBot/0.1 (+local sales pipeline research)",
        accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) return null;

    return {
      url: response.url || url,
      html: (await response.text()).slice(0, 200_000)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getBusinessNameVariants(lead: Pick<VerificationLead, "businessName" | "location">) {
  const baseName = lead.businessName
    .split(/\s[-–—|]\s/)[0]
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(inc|ltd|llc|limited|corp|corporation|company|co)\b/gi, " ");
  const locationTokens = new Set(getLocationTokens(lead.location));
  const tokens = tokenize(baseName).filter((token) => !locationTokens.has(token));
  const variants = new Set<string>();

  addDomainVariant(variants, tokens);
  addDomainVariant(
    variants,
    tokens.filter((token) => !genericBusinessTerms.has(token))
  );

  if (tokens.length > 2) {
    addDomainVariant(variants, tokens.slice(0, 2));
  }

  return [...variants].filter((variant) => variant.length >= 7).slice(0, 4);
}

function addDomainVariant(variants: Set<string>, tokens: string[]) {
  const value = tokens.join("");
  if (value.length >= 7) variants.add(value);
}

function getDistinctiveTokens(lead: Pick<VerificationLead, "businessName" | "location">) {
  const locationTokens = new Set(getLocationTokens(lead.location));

  return tokenize(lead.businessName.split(/\s[-–—|]\s/)[0])
    .filter((token) => token.length >= 3)
    .filter((token) => !locationTokens.has(token));
}

function getLocationTokens(location: string | null) {
  return tokenize(location ?? "").filter((token) => token.length >= 4);
}

function hasTokenEvidence(tokens: string[], text: string) {
  const meaningfulTokens = tokens.filter((token) => token.length >= 4);
  return meaningfulTokens.some((token) => text.includes(token));
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getPhoneDigits(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function getCompactHost(websiteUrl: string) {
  try {
    return compact(new URL(websiteUrl).hostname.replace(/^www\./, "").split(".").slice(0, -1).join(""));
  } catch {
    return compact(websiteUrl);
  }
}

function isCanadianLead(location: string | null) {
  return /\b(canada|ca|ns|nb|pe|nl|qc|on|mb|sk|ab|bc|yt|nt|nu)\b/i.test(location ?? "");
}

function isParkedDomain(html: string) {
  return parkedDomainPatterns.some((pattern) => pattern.test(html));
}

async function searchForOfficialPresence(lead: VerificationLead): Promise<VerifiedWebsite | null> {
  const results = await searchWeb(lead);
  const match = results.slice(0, 5).find((result) => searchResultLooksOfficial(lead, result));
  if (!match) return null;

  return {
    url: match.url,
    evidence: "search result matched official website or social profile"
  };
}

async function searchWeb(lead: VerificationLead) {
  const query = [lead.businessName, lead.location ?? lead.address].filter(Boolean).join(" ");

  if (process.env.BRAVE_SEARCH_API_KEY) {
    return searchBrave(query, process.env.BRAVE_SEARCH_API_KEY);
  }

  if (process.env.SERPAPI_API_KEY) {
    return searchSerpApi(query, process.env.SERPAPI_API_KEY);
  }

  return [];
}

async function searchBrave(query: string, apiKey: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: "5",
    search_lang: "en",
    safesearch: "moderate"
  });

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        accept: "application/json",
        "x-subscription-token": apiKey
      }
    });

    if (!response.ok) return [];
    const payload = (await response.json()) as {
      web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
    };

    return (payload.web?.results ?? []).flatMap((result) =>
      result.url
        ? [{
            title: result.title ?? "",
            url: result.url,
            description: result.description ?? ""
          }]
        : []
    );
  } catch {
    return [];
  }
}

async function searchSerpApi(query: string, apiKey: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: apiKey,
    num: "5"
  });

  try {
    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
    };

    return (payload.organic_results ?? []).flatMap((result) =>
      result.link
        ? [{
            title: result.title ?? "",
            url: result.link,
            description: result.snippet ?? ""
          }]
        : []
    );
  } catch {
    return [];
  }
}

function searchResultLooksOfficial(lead: VerificationLead, result: SearchResult) {
  const host = getHostname(result.url);
  if (directoryHosts.some((directoryHost) => host.endsWith(directoryHost))) return false;

  const tokens = getDistinctiveTokens(lead).filter((token) => !genericBusinessTerms.has(token));
  const resultText = `${result.title} ${result.description} ${host}`.toLowerCase();
  const tokenEvidence = tokens.length
    ? tokens.some((token) => resultText.includes(token))
    : hasTokenEvidence(getDistinctiveTokens(lead), resultText);

  if (!tokenEvidence) return false;
  if (socialHosts.some((socialHost) => host.endsWith(socialHost))) return true;

  const compactName = compact(getDistinctiveTokens(lead).join(""));
  const compactResult = compact(`${result.title} ${result.description} ${host}`);
  return compactName.length >= 8 && compactResult.includes(compactName);
}

function getHostname(websiteUrl: string) {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return websiteUrl.toLowerCase();
  }
}

const genericBusinessTerms = new Set([
  "and",
  "the",
  "hair",
  "salon",
  "barber",
  "barbershop",
  "shop",
  "beauty",
  "skincare",
  "skin",
  "spa",
  "nail",
  "nails",
  "clinic",
  "dental",
  "restaurant",
  "cafe",
  "coffee",
  "plumbing",
  "electric",
  "electrical",
  "contractor",
  "company",
  "service",
  "services"
]);

const parkedDomainPatterns = [
  /domain\s+is\s+parked/i,
  /buy\s+this\s+domain/i,
  /this\s+domain\s+is\s+for\s+sale/i,
  /sedo\.com/i,
  /afternic\.com/i,
  /namecheap/i,
  /godaddy\.com\/forsale/i
];

const socialHosts = [
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
  "x.com",
  "twitter.com"
];

const directoryHosts = [
  "google.com",
  "maps.google.com",
  "yelp.com",
  "yellowpages.ca",
  "yellowpages.com",
  "foursquare.com",
  "tripadvisor.com",
  "mapcarta.com",
  "dnb.com",
  "bbb.org",
  "chamberofcommerce.com",
  "opencorporates.com",
  "nicelocal.ca",
  "cybo.com"
];
