import fs from "node:fs";

const requiredTables = [
  "leads",
  "interactions",
  "pitch_templates",
  "deals",
  "pricing_templates",
  "discovery_runs",
  "discovered_leads",
  "api_usage_events"
];

const requiredColumnChecks = [
  {
    table: "discovery_runs",
    columns: ["search_depth", "quality_filter", "min_rating", "min_reviews"]
  },
  {
    table: "discovered_leads",
    columns: ["contactability_score", "website_gap", "discovery_fit", "conversion_strength"]
  },
  {
    table: "leads",
    columns: ["contactability_score", "website_gap", "discovery_fit"]
  }
];

const env = parseEnv(fs.readFileSync(".env.local", "utf8"));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("Supabase URL or anon key is missing in .env.local.");
  process.exit(1);
}

let hasFailure = false;

for (const table of requiredTables) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=id&limit=1`;
  let response;
  try {
    response = await fetch(url, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`
      }
    });
  } catch (error) {
    console.error(`Could not reach Supabase REST API: ${error instanceof Error ? error.message : "network error"}`);
    console.error("Check your network connection, then rerun npm run check:supabase.");
    process.exit(1);
  }

  if (response.ok) {
    console.log(`${table}: ready`);
    continue;
  }

  const body = await response.text();
  const isMissing = body.includes("schema cache") || body.includes("not find the table");
  console.log(`${table}: ${isMissing ? "missing table" : `not ready (${response.status})`}`);
  hasFailure = true;
}

for (const check of requiredColumnChecks) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${check.table}?select=${check.columns.join(",")}&limit=1`;
  let response;
  try {
    response = await fetch(url, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`
      }
    });
  } catch (error) {
    console.error(`Could not reach Supabase REST API: ${error instanceof Error ? error.message : "network error"}`);
    console.error("Check your network connection, then rerun npm run check:supabase.");
    process.exit(1);
  }

  if (response.ok) {
    console.log(`${check.table} columns: ready`);
    continue;
  }

  const body = await response.text();
  const isMissing = body.includes("schema cache") || body.includes("Could not find");
  console.log(`${check.table} columns: ${isMissing ? "missing columns" : `not ready (${response.status})`}`);
  hasFailure = true;
}

if (hasFailure) {
  console.error("\nRun supabase/setup.sql in the Supabase SQL Editor, then restart the app.");
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
