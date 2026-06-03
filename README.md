# Local Sales Pipeline MVP

A scalable MVP sales pipeline for a local web developer selling websites to small businesses.

The app tracks local business leads, follow-ups, pitches, demos, interactions, deals, pricing defaults, and generated outreach copy. Branding, naming, and logo space are intentionally left neutral so the product identity can come later.

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
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Supabase Setup

Create a Supabase project, then run the SQL migrations in order:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_lead_discovery.sql
```

The schema creates:

- `leads`
- `interactions`
- `pitch_templates`
- `deals`
- `pricing_templates`

It also adds indexes for status, industry, website status, follow-up date, business-name search, and future `account_id` filtering.

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

- `GOOGLE_PLACES_API_KEY` for Google Places local business results
- `YELP_API_KEY` as an optional fallback provider

For each discovered business, the app tries to show:

- Phone number for dialing
- Website URL or no-website status
- Detected booking or appointment system
- Lead score
- Opportunity grade and call priority
- Existing-lead detection so saved businesses move to the bottom
- Reasons the lead may be worth contacting

Click `Save` to add a discovered business to the normal pipeline.

Lead Finder now ranks results like a prospecting console:

- `A` grade: call first
- `B` grade: good call
- `C` grade: maybe later
- `D` grade: low priority or research first

The scoring model rewards businesses with a phone number, no website, weak/thin websites, weak contact CTAs, no detected booking system, local-service categories, and signs of existing local demand. It downranks businesses with stronger sites or already-detected booking systems.

The booking detector currently checks for common systems and signals such as Calendly, Acuity, Square Appointments, Vagaro, Mindbody, Fresha, OpenTable, Resy, Toast, Tock, Booksy, Jane App, Boulevard, Shopify, and generic booking CTAs.

## Codex MCP For Supabase

This repo is ready to work with the hosted Supabase MCP server in Codex.

The MCP server is added globally to Codex with:

```bash
codex mcp add supabase --url https://mcp.supabase.com/mcp
```

Then authenticate in a normal terminal:

```bash
codex mcp login supabase
```

After login, restart Codex and ask it to use the Supabase MCP tools to inspect or apply migrations.

For development safety, keep MCP connected to a development Supabase project rather than production data. If you want the MCP server scoped to one project later, use your Supabase project ref with:

```bash
codex mcp remove supabase
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
codex mcp login supabase
```

## Useful Commands

```bash
npm run typecheck
npm run build
npm run dev
```

## Notes For Future Growth

- Replace manual `lib/types/database.ts` with generated Supabase types once the hosted project exists.
- Add Supabase Auth and attach `account_id` to authenticated users.
- Add row-level security policies before production use.
- Move pitch generation behind an AI service module when AI features are added.
- Add tests around services and server actions as workflows stabilize.
