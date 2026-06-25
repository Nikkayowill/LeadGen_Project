# SiteScout

A sales pipeline app for a local web developer selling websites to small businesses.

The app tracks local business leads, follow-ups, pitches, demos, interactions, deals, pricing defaults, and outreach copy.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- shadcn/ui-style local components
- Server actions and service-layer database access

## Features

- Dashboard metrics for total leads, follow-ups due, demos booked, won deals, and potential revenue
- Add, edit, and delete leads
- Search leads by business name
- Filter leads by status, industry, website status, and follow-up date
- Find leads online with Google Places or Yelp, then enrich them for phone, website, booking-system signals, and lead score
- Lead detail pages with notes, interactions, status, pricing, and next follow-up
- Follow-up queue for leads due today or overdue
- Pitch generator for Facebook messages, phone scripts, and follow-up messages
- Settings area for pricing templates and pitch templates
- Default pricing of `$500` one-time and `$20/month`
- Supabase schema designed with future `account_id` support for multiple users/accounts

## Project Structure

```txt
app/                    App Router routes, layouts, loading/error states, server actions
components/             Reusable UI, layout, lead, form, and settings components
lib/                    Constants, utilities, Supabase clients, pitch helpers, typed models
services/               Database access and domain service functions
supabase/migrations/    SQL schema and seed defaults
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_PLACES_API_KEY=
YELP_API_KEY=
GOOGLE_PLACES_DAILY_LIMIT=10
GOOGLE_PLACES_MAX_RESULTS=5
YELP_DAILY_LIMIT=10
YELP_MAX_RESULTS=5
LEAD_FINDER_ALLOW_PAID_AUTO=false
ALLOWED_ORIGINS=
RATE_LIMIT_REQUESTS_PER_MINUTE=10
RATE_LIMIT_REQUESTS_PER_HOUR=60
```

`ALLOWED_ORIGINS` is optional and comma-separated. Leave it empty for strict same-origin protection.
The middleware also rate-limits unsafe requests per IP and path so server actions do not accept bursts.

Google Places and Yelp are optional. The Lead Finder can run with OpenStreetMap/Overpass without API keys, though coverage varies by location and niche.

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Local-Only Use

This app can run only on your machine. You do not need to deploy it anywhere if your workflow is: search leads, save them, then call from your local browser.

For local-only development, server-side Supabase calls can use a service role key by setting:

```bash
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_USE_SERVICE_ROLE=true
```

This bypasses RLS for local use. Do not deploy a public app with `SUPABASE_USE_SERVICE_ROLE=true` unless you first add real authentication and account-scoped authorization.

The app still needs internet access for hosted Supabase, Google Places, Yelp, and OpenStreetMap. To make the database itself local, you would need a local Supabase/Postgres setup.

## Supabase Setup

Create a Supabase project, then run the SQL migrations in order:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_lead_discovery.sql
supabase/migrations/003_discovery_runs_and_staging.sql
supabase/migrations/004_openstreetmap_provider.sql
supabase/migrations/005_conversion_strength.sql
supabase/migrations/006_development_rls_policies.sql
supabase/migrations/007_discovery_methodology_and_api_limits.sql
supabase/migrations/008_google_quality_search_methodology.sql
```

For the easiest setup, paste and run this combined SQL file in the Supabase SQL Editor:

```txt
supabase/setup.sql
```

The schema creates:

- `leads`
- `interactions`
- `pitch_templates`
- `deals`
- `pricing_templates`
- `discovery_runs`
- `discovered_leads`
- `api_usage_events`

It also adds indexes for status, industry, website status, follow-up date, business-name search, and future `account_id` filtering.

After running the SQL, verify the app is ready:

```bash
npm run check:ready
```

If `check:supabase` says a table is missing, rerun `supabase/setup.sql` in the same Supabase project connected by `.env.local`.

## Lead Finder

Open:

```txt
http://localhost:3000/lead-finder
```

Search by business type and location, such as:

```txt
salons in Halifax, NS
dentists in Dartmouth, NS
roofers in Moncton, NB
restaurants in Charlottetown, PE
```

The finder uses:

- OpenStreetMap/Overpass for free local business discovery
- Nominatim for one free location lookup per search
- `GOOGLE_PLACES_API_KEY` for Google quality mode with dialable business data
- `YELP_API_KEY` as an optional paid fallback provider

Paid-provider guardrails:

- Auto mode is free-only by default. Set `LEAD_FINDER_ALLOW_PAID_AUTO=true` only when you want Auto to fall back to Google/Yelp.
- Google defaults to `10` paid searches per day and `5` results per search.
- Yelp defaults to `10` paid searches per day and `5` results per search.
- Google quality mode supports `Focused`, `Standard`, and `Deep` search depth. Focused uses 1 query, Standard uses up to 3 query variants, and Deep uses up to 6 query variants.
- Usage is recorded in `api_usage_events` so the limit survives app restarts.

Google quality mode works like a lightweight lead-source engine:

- Expands a niche into nearby buying-intent searches, such as `plumber`, `plumbing contractor`, and `emergency plumber`.
- Filters by minimum review count and optional minimum rating so the list is warmer.
- Dedupes businesses across query variants.
- Enriches websites for booking, ordering, conversion, and weak-site signals.
- Shows only call-ready or reviewable prospects by default.

For each discovered business, the app tries to show:

- Phone number for dialing
- Website URL or no-website status
- Detected booking or appointment system
- Contactability score
- Website gap classification
- Opportunity grade and call fit
- Existing-lead detection so saved businesses move to the bottom
- Reasons the lead may be worth contacting

Click `Save` to add a discovered business to the normal pipeline. Click `Save as run` to store the whole search as a discovery run with staged prospects you can review later.

Lead Finder now ranks results like a prospecting console:

- `Call now`: phone number plus a strong website gap, with no detected booking system
- `Review first`: useful but needs a quick manual website check
- `Research`: not enough contact or website evidence yet
- `Skip`: solved businesses with strong websites, booking systems, or strong conversion flow

The scoring model rewards businesses with a phone number, provider-level no-website evidence, weak/thin websites, weak contact CTAs, local-service categories, and signs of existing local demand. It hides solved businesses from live results when they already have a strong site, booking/ordering/reservation system, or strong conversion flow.

Batch 1 of the prospecting backbone adds:

- Saved discovery runs by niche/location
- Staged discovered leads before they become pipeline leads
- Recent discovery runs on `/lead-finder`
- Review pages at `/lead-finder/runs/[id]`
- Promote-to-pipeline actions that avoid duplicate leads

The booking detector currently checks for common systems and signals such as Calendly, Acuity, Square Appointments, Vagaro, Mindbody, Fresha, OpenTable, Resy, SevenRooms, Toast, Tock, DoorDash, ChowNow, Booksy, GlossGenius, Jane App, Jobber, Housecall Pro, Boulevard, Shopify, and generic booking CTAs.

Free-provider note: OpenStreetMap data is community-maintained. Many businesses will not have phone numbers or websites listed, but the results are free and useful for building a low-cost prospecting workflow. Public Nominatim usage should stay light; this app performs one location lookup per search.

## Useful Commands

```bash
npm run typecheck
npm run build
npm run dev
npm run check:env
npm run check:supabase
npm run check:ready
```

## Notes For Future Growth

- Replace manual `lib/types/database.ts` with generated Supabase types once the hosted project exists.
- Add Supabase Auth and attach `account_id` to authenticated users.
- Add row-level security policies before production use.
- Add tests around services and server actions as workflows stabilize.
