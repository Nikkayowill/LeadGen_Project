import { NextRequest, NextResponse } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ONE_MINUTE = 60_000;
const ONE_HOUR = 60 * ONE_MINUTE;
const MAX_REQUESTS_PER_MINUTE = Number(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE ?? 10);
const MAX_REQUESTS_PER_HOUR = Number(process.env.RATE_LIMIT_REQUESTS_PER_HOUR ?? 60);
const ADDITIONAL_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

type RateState = {
  timestamps: number[];
};

type RateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      resetAt: number;
    };

const rateStore = new Map<string, RateState>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor ?? request.headers.get("x-real-ip") ?? "unknown";
}

function getAllowedOrigins(request: NextRequest) {
  return new Set([request.nextUrl.origin, ...ADDITIONAL_ALLOWED_ORIGINS]);
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return getAllowedOrigins(request).has(origin);
}

function createCorsResponse(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", request.headers.get("origin") ?? request.nextUrl.origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    request.headers.get("access-control-request-headers") ?? "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Max-Age", "600");
  response.headers.set("Vary", "Origin");
  return response;
}

function checkRateLimit(request: NextRequest): RateLimitResult {
  const now = Date.now();
  const key = `${getClientIp(request)}:${request.nextUrl.pathname}`;
  const state = rateStore.get(key) ?? { timestamps: [] };
  const timestamps = state.timestamps.filter((timestamp) => now - timestamp < ONE_HOUR);
  const recentMinute = timestamps.filter((timestamp) => now - timestamp < ONE_MINUTE);

  if (recentMinute.length >= MAX_REQUESTS_PER_MINUTE) {
    const resetAt = recentMinute[0] + ONE_MINUTE;
    return { allowed: false, resetAt };
  }

  if (timestamps.length >= MAX_REQUESTS_PER_HOUR) {
    const resetAt = timestamps[0] + ONE_HOUR;
    return { allowed: false, resetAt };
  }

  timestamps.push(now);
  rateStore.set(key, { timestamps });
  return { allowed: true };
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(request)) {
      return new NextResponse("CORS origin blocked", { status: 403 });
    }

    return createCorsResponse(request);
  }

  if (!UNSAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  if (!isAllowedOrigin(request)) {
    return new NextResponse("Cross-origin requests are blocked", { status: 403 });
  }

  const limit = checkRateLimit(request);
  if (!limit.allowed) {
    const response = new NextResponse("Rate limit exceeded", { status: 429 });
    response.headers.set("Retry-After", String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};