import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DiscoveryProvider, LeadFinderSearch } from "@/lib/types/discovery";

type PaidProvider = Extract<DiscoveryProvider, "google_places" | "yelp">;

type LimitConfig = {
  dailyLimit: number;
  maxResultsPerSearch: number;
};

const defaultLimits: Record<PaidProvider, LimitConfig> = {
  google_places: {
    dailyLimit: 10,
    maxResultsPerSearch: 5
  },
  yelp: {
    dailyLimit: 10,
    maxResultsPerSearch: 5
  }
};

const memoryUsage = new Map<string, number>();

export function paidAutoFallbackEnabled() {
  return process.env.LEAD_FINDER_ALLOW_PAID_AUTO === "true";
}

export function clampPaidResults(provider: PaidProvider, requested: number) {
  const max = getLimitConfig(provider).maxResultsPerSearch;
  return Math.min(requested, max);
}

export async function guardPaidProviderUsage(provider: PaidProvider, input: LeadFinderSearch) {
  const config = getLimitConfig(provider);
  const today = new Date().toISOString().slice(0, 10);
  const used = await getDailyUsage(provider, today);

  if (used >= config.dailyLimit) {
    throw new Error(
      `${getProviderLabel(provider)} daily limit reached (${used}/${config.dailyLimit}). Raise ${getDailyEnvKey(
        provider
      )} only when you intentionally want to spend more.`
    );
  }

  return {
    maxResults: clampPaidResults(provider, input.maxResults),
    remainingToday: Math.max(config.dailyLimit - used - 1, 0)
  };
}

export async function recordPaidProviderUsage(
  provider: PaidProvider,
  input: LeadFinderSearch,
  resultCount: number,
  metadata: Record<string, string | number | boolean | null> = {}
) {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("api_usage_events").insert({
      provider,
      feature: "lead_finder",
      units: 1,
      query: input.query,
      location: input.location,
      result_count: resultCount,
      metadata: {
        radiusMiles: input.radiusMiles,
        requestedMaxResults: input.maxResults,
        searchDepth: input.searchDepth,
        qualityFilter: input.qualityFilter,
        minRating: input.minRating,
        minReviews: input.minReviews,
        ...metadata
      }
    });
  } catch {
    const key = getMemoryKey(provider, today);
    memoryUsage.set(key, (memoryUsage.get(key) ?? 0) + 1);
  }
}

function getLimitConfig(provider: PaidProvider): LimitConfig {
  return {
    dailyLimit: readPositiveInt(getDailyEnvKey(provider), defaultLimits[provider].dailyLimit),
    maxResultsPerSearch: readPositiveInt(getMaxResultsEnvKey(provider), defaultLimits[provider].maxResultsPerSearch)
  };
}

async function getDailyUsage(provider: PaidProvider, date: string) {
  try {
    const supabase = createServerSupabaseClient();
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const { data, error } = await supabase
      .from("api_usage_events")
      .select("units")
      .eq("provider", provider)
      .gte("created_at", start)
      .lte("created_at", end)
      .limit(1000);

    if (error) throw error;
    return (data ?? []).reduce((sum, event) => sum + event.units, 0);
  } catch {
    return memoryUsage.get(getMemoryKey(provider, date)) ?? 0;
  }
}

function readPositiveInt(key: string, fallback: number) {
  const value = Number(process.env[key]);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.round(value);
}

function getDailyEnvKey(provider: PaidProvider) {
  return provider === "google_places" ? "GOOGLE_PLACES_DAILY_LIMIT" : "YELP_DAILY_LIMIT";
}

function getMaxResultsEnvKey(provider: PaidProvider) {
  return provider === "google_places" ? "GOOGLE_PLACES_MAX_RESULTS" : "YELP_MAX_RESULTS";
}

function getProviderLabel(provider: PaidProvider) {
  return provider === "google_places" ? "Google Places" : "Yelp";
}

function getMemoryKey(provider: PaidProvider, date: string) {
  return `${provider}:${date}`;
}
