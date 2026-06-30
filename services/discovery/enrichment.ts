import type { BookingSignal, ConversionStrength, WebsiteQuality } from "@/lib/types/discovery";

const bookingDetectors: Array<{ system: string; patterns: RegExp[] }> = [
  { system: "Calendly", patterns: [/calendly\.com/i] },
  { system: "Acuity", patterns: [/acuityscheduling\.com/i, /as\.me\//i] },
  { system: "Square Appointments", patterns: [/squareup\.com\/appointments/i] },
  { system: "Square", patterns: [/squareup\.com/i] },
  { system: "Vagaro", patterns: [/vagaro\.com/i] },
  { system: "Mindbody", patterns: [/mindbodyonline\.com/i] },
  { system: "Fresha", patterns: [/fresha\.com/i] },
  { system: "OpenTable", patterns: [/opentable\.com/i] },
  { system: "Resy", patterns: [/resy\.com/i] },
  { system: "Toast", patterns: [/toasttab\.com/i] },
  { system: "SevenRooms", patterns: [/sevenrooms\.com/i] },
  { system: "TableAgent", patterns: [/tableagent\.com/i] },
  { system: "ResDiary", patterns: [/resdiary\.com/i] },
  { system: "Eat App", patterns: [/eatapp\.co/i] },
  { system: "Tock", patterns: [/exploretock\.com/i] },
  { system: "Booksy", patterns: [/booksy\.com/i] },
  { system: "GlossGenius", patterns: [/glossgenius\.com/i] },
  { system: "Schedulicity", patterns: [/schedulicity\.com/i] },
  { system: "Phorest", patterns: [/phorest\.com/i] },
  { system: "Zenoti", patterns: [/zenoti\.com/i] },
  { system: "Jane App", patterns: [/janeapp\.com/i] },
  { system: "Zocdoc", patterns: [/zocdoc\.com/i] },
  { system: "Boulevard", patterns: [/blvd\.co/i] },
  { system: "Jobber", patterns: [/getjobber\.com|clienthub\.getjobber\.com/i] },
  { system: "Housecall Pro", patterns: [/housecallpro\.com/i] },
  { system: "Shopify", patterns: [/cdn\.shopify\.com/i, /myshopify\.com/i] },
  { system: "Wix Bookings", patterns: [/wixbookings/i, /wixstatic\.com\/.*bookings/i] },
  { system: "Squarespace Scheduling", patterns: [/squarespacescheduling\.com/i, /acuityscheduling/i] },
  { system: "SimplyBook", patterns: [/simplybook\.me/i] },
  { system: "Setmore", patterns: [/setmore\.com/i] },
  { system: "Appointlet", patterns: [/appointlet\.com/i] },
  { system: "YouCanBookMe", patterns: [/youcanbook\.me/i] },
  { system: "Bookeo", patterns: [/bookeo\.com/i] },
  { system: "FareHarbor", patterns: [/fareharbor\.com/i] },
  { system: "Checkfront", patterns: [/checkfront\.com/i] },
  { system: "Eventbrite", patterns: [/eventbrite\./i] },
  { system: "DoorDash", patterns: [/doordash\.com/i] },
  { system: "Uber Eats", patterns: [/ubereats\.com/i] },
  { system: "ChowNow", patterns: [/chownow\.com/i] },
  { system: "Clover", patterns: [/clover\.com\/online-ordering|clover\.com\/online-menu/i] },
  { system: "SpotOn", patterns: [/spoton\.com/i] },
  { system: "WooCommerce", patterns: [/woocommerce/i, /wc-cart-fragments/i] },
  { system: "Stripe Checkout", patterns: [/checkout\.stripe\.com/i, /js\.stripe\.com/i] }
];

const bookingLanguage = [
  /book\s+(now|online|appointment|a\s+consultation|a\s+demo)/i,
  /schedule\s+(now|online|appointment|a\s+call|a\s+consultation)/i,
  /reserve\s+(now|a\s+table|online)/i,
  /order\s+(now|online)/i,
  /online\s+(booking|reservation|appointment)/i,
  /make\s+(a\s+reservation|an\s+appointment)/i,
  /request\s+an?\s+(appointment|consultation)/i,
  /start\s+an?\s+(order|reservation)/i
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

const strongConversionPatterns = [
  /book\s+now/i,
  /schedule\s+now/i,
  /reserve\s+now/i,
  /order\s+online/i,
  /online\s+ordering/i,
  /view\s+(our\s+)?menu/i,
  /shop\s+now/i,
  /get\s+started/i,
  /request\s+(a\s+quote|an\s+estimate|an\s+appointment)/i
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
      conversionStrength: "none" as ConversionStrength,
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
      conversionStrength: "weak" as ConversionStrength,
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
  const hasStrongConversionCta = strongConversionPatterns.some((pattern) => pattern.test(html));
  const hasTelLink = /href=["']tel:/i.test(html);
  const hasMailLink = /href=["']mailto:/i.test(html);
  const hasSocialSignal = socialPatterns.some((pattern) => pattern.test(html));
  const platformSignal = platformPatterns.find((item) => item.pattern.test(html));
  const linkCount = countMatches(html, /<a\s/gi);
  const formCount = countMatches(html, /<form\s/gi);
  const textLength = stripHtml(html).length;

  if (hasContactSignal) websiteSignals.push("contact CTA found");
  if (!hasContactSignal) websiteSignals.push("weak contact CTA");
  if (hasStrongConversionCta) websiteSignals.push("strong conversion CTA");
  if (hasTelLink) websiteSignals.push("click-to-call link");
  if (hasMailLink) websiteSignals.push("email link");
  if (formCount > 0) websiteSignals.push("form detected");
  if (hasSocialSignal) websiteSignals.push("social links found");
  if (platformSignal) websiteSignals.push(platformSignal.label);
  if (linkCount < 8) websiteSignals.push("thin site structure");
  if (textLength < 1200) websiteSignals.push("low page content");

  const conversionStrength = getConversionStrength({
    bookingSignals,
    formCount,
    hasContactSignal,
    hasStrongConversionCta,
    hasTelLink,
    hasMailLink
  });

  const websiteQuality = getWebsiteQuality({
    bookingSignals,
    conversionStrength,
    formCount,
    hasContactSignal,
    linkCount,
    textLength
  });

  return {
    hasWebsite: true,
    websiteQuality,
    websiteSignals,
    conversionStrength,
    bookingSystem: bookingSignals[0]?.system ?? null,
    bookingSignals
  };
}

function getWebsiteQuality(input: {
  bookingSignals: BookingSignal[];
  conversionStrength: ConversionStrength;
  formCount: number;
  hasContactSignal: boolean;
  linkCount: number;
  textLength: number;
}): WebsiteQuality {
  if (input.textLength < 800 || input.linkCount < 5) return "thin";
  if (
    input.conversionStrength === "strong" &&
    input.hasContactSignal &&
    (input.formCount > 0 || input.bookingSignals.length)
  ) {
    return "solid";
  }
  if (input.hasContactSignal || input.formCount > 0 || input.bookingSignals.length) return "basic";
  return "thin";
}

function getConversionStrength(input: {
  bookingSignals: BookingSignal[];
  formCount: number;
  hasContactSignal: boolean;
  hasStrongConversionCta: boolean;
  hasTelLink: boolean;
  hasMailLink: boolean;
}): ConversionStrength {
  let strength = 0;
  if (input.bookingSignals.some((signal) => signal.confidence === "high")) strength += 3;
  if (input.bookingSignals.some((signal) => signal.confidence === "medium")) strength += 2;
  if (input.hasStrongConversionCta) strength += 2;
  if (input.formCount > 0) strength += 1;
  if (input.hasContactSignal) strength += 1;
  if (input.hasTelLink || input.hasMailLink) strength += 1;

  if (strength >= 5) return "strong";
  if (strength >= 3) return "moderate";
  if (strength >= 1) return "weak";
  return "none";
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
  for (const url of getWebsiteFetchUrls(websiteUrl)) {
    const html = await fetchSingleWebsiteText(url);
    if (html) return html;
  }

  return null;
}

async function fetchSingleWebsiteText(websiteUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "LeadFinderBot/0.1 (+local sales pipeline research)"
      }
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return (await response.text()).slice(0, 300_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getWebsiteFetchUrls(websiteUrl: string) {
  const urls = [websiteUrl];
  if (websiteUrl.startsWith("https://")) {
    urls.push(websiteUrl.replace(/^https:\/\//, "http://"));
  }
  return urls;
}
