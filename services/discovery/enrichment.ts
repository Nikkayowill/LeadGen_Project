import type { BookingSignal, WebsiteQuality } from "@/lib/types/discovery";

const bookingDetectors: Array<{ system: string; patterns: RegExp[] }> = [
  { system: "Calendly", patterns: [/calendly\.com/i] },
  { system: "Acuity", patterns: [/acuityscheduling\.com/i, /as\.me\//i] },
  { system: "Square Appointments", patterns: [/squareup\.com\/appointments/i] },
  { system: "Vagaro", patterns: [/vagaro\.com/i] },
  { system: "Mindbody", patterns: [/mindbodyonline\.com/i] },
  { system: "Fresha", patterns: [/fresha\.com/i] },
  { system: "OpenTable", patterns: [/opentable\.com/i] },
  { system: "Resy", patterns: [/resy\.com/i] },
  { system: "Toast", patterns: [/toasttab\.com/i] },
  { system: "Tock", patterns: [/exploretock\.com/i] },
  { system: "Booksy", patterns: [/booksy\.com/i] },
  { system: "Jane App", patterns: [/janeapp\.com/i] },
  { system: "Boulevard", patterns: [/blvd\.co/i] },
  { system: "Shopify", patterns: [/cdn\.shopify\.com/i, /myshopify\.com/i] }
];

const bookingLanguage = [
  /book\s+(now|online|appointment|a\s+consultation|a\s+demo)/i,
  /schedule\s+(now|online|appointment|a\s+call|a\s+consultation)/i,
  /reserve\s+(now|a\s+table|online)/i,
  /online\s+(booking|reservation|appointment)/i
];

const socialPatterns = [
  /facebook\.com/i,
  /instagram\.com/i,
  /tiktok\.com/i,
  /linkedin\.com/i
];

const contactPatterns = [
  /href=["']mailto:/i,
  /href=["']tel:/i,
  /contact\s+us/i,
  /get\s+a\s+quote/i,
  /request\s+(a\s+quote|an\s+estimate)/i,
  /free\s+(quote|estimate|consultation)/i
];

const platformPatterns = [
  { label: "Wix site", pattern: /wixstatic\.com|wix\.com/i },
  { label: "Squarespace site", pattern: /squarespace\.com|static1\.squarespace\.com/i },
  { label: "WordPress site", pattern: /wp-content|wordpress/i },
  { label: "Shopify store", pattern: /cdn\.shopify\.com|myshopify\.com/i }
];

export async function enrichWebsite(websiteUrl: string | null) {
  if (!websiteUrl) {
    return {
      hasWebsite: false,
      websiteQuality: "no_website" as WebsiteQuality,
      websiteSignals: ["no website listed"],
      bookingSystem: null,
      bookingSignals: [] as BookingSignal[]
    };
  }

  const html = await fetchWebsiteText(websiteUrl);
  if (!html) {
    return {
      hasWebsite: true,
      websiteQuality: "unreachable" as WebsiteQuality,
      websiteSignals: ["website listed but could not be scanned"],
      bookingSystem: null,
      bookingSignals: [] as BookingSignal[]
    };
  }

  const bookingSignals: BookingSignal[] = [];
  const websiteSignals: string[] = [];

  for (const detector of bookingDetectors) {
    if (detector.patterns.some((pattern) => pattern.test(html))) {
      bookingSignals.push({ system: detector.system, confidence: "high" });
    }
  }

  if (!bookingSignals.length && bookingLanguage.some((pattern) => pattern.test(html))) {
    bookingSignals.push({ system: "Generic booking CTA", confidence: "medium" });
  }

  const hasContactSignal = contactPatterns.some((pattern) => pattern.test(html));
  const hasSocialSignal = socialPatterns.some((pattern) => pattern.test(html));
  const platformSignal = platformPatterns.find((item) => item.pattern.test(html));
  const linkCount = countMatches(html, /<a\s/gi);
  const formCount = countMatches(html, /<form\s/gi);
  const textLength = stripHtml(html).length;

  if (hasContactSignal) websiteSignals.push("contact CTA found");
  if (!hasContactSignal) websiteSignals.push("weak contact CTA");
  if (formCount > 0) websiteSignals.push("form detected");
  if (hasSocialSignal) websiteSignals.push("social links found");
  if (platformSignal) websiteSignals.push(platformSignal.label);
  if (linkCount < 8) websiteSignals.push("thin site structure");
  if (textLength < 1200) websiteSignals.push("low page content");

  const websiteQuality = getWebsiteQuality({
    bookingSignals,
    formCount,
    hasContactSignal,
    linkCount,
    textLength
  });

  return {
    hasWebsite: true,
    websiteQuality,
    websiteSignals,
    bookingSystem: bookingSignals[0]?.system ?? null,
    bookingSignals
  };
}

function getWebsiteQuality(input: {
  bookingSignals: BookingSignal[];
  formCount: number;
  hasContactSignal: boolean;
  linkCount: number;
  textLength: number;
}): WebsiteQuality {
  if (input.textLength < 800 || input.linkCount < 5) return "thin";
  if (input.hasContactSignal && input.formCount > 0 && input.bookingSignals.length) return "solid";
  if (input.hasContactSignal || input.formCount > 0 || input.bookingSignals.length) return "basic";
  return "thin";
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWebsiteText(websiteUrl: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "LeadFinderBot/0.1 (+local sales pipeline research)"
      }
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return (await response.text()).slice(0, 300_000);
  } catch {
    return null;
  }
}
