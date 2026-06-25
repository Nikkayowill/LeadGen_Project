import fs from "node:fs";

const envPath = ".env.local";
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const optional = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_PLACES_DAILY_LIMIT",
  "GOOGLE_PLACES_MAX_RESULTS",
  "YELP_API_KEY",
  "YELP_DAILY_LIMIT",
  "YELP_MAX_RESULTS",
  "LEAD_FINDER_ALLOW_PAID_AUTO",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE",
  "SUPABASE_USE_SERVICE_ROLE",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_DB_PASS"
];

if (!fs.existsSync(envPath)) {
  console.error(".env.local is missing.");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const missing = [];

for (const key of required) {
  const value = env[key] ?? "";
  console.log(`${key}: ${value ? `set (${value.length} chars)` : "missing"}`);
  if (!value) missing.push(key);
}

for (const key of optional) {
  const value = env[key] ?? "";
  console.log(`${key}: ${value ? `set (${value.length} chars)` : "optional / empty"}`);
}

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}
