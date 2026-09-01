# GoFix Services CRM

A combined client management + job scheduling + field photo documentation system
for GoFix Services (HVAC, Electrical, Plumbing across the GTA). It replaces
running Jobber and CompanyCam as two separate tools — every job carries its
quoting/scheduling data and its photo/documentation timeline in one place.

This README is written for someone with **no prior coding, git, or cloud
console experience**. Follow it top to bottom the first time; after that,
you'll mostly just need "Everyday use" near the bottom.

---

## What's built so far

This is being built in phases (see `docs/build-phases.md` conceptually — really
just the plan below). Right now:

- ✅ **Phase 1 — Foundation**: staff login (email/password, optional Google),
  roles (Admin / Office / Field / Subcontractor), client records with multiple
  contacts and properties, basic job creation.
- ✅ **Phase 2 — Scheduling core**: job status pipeline, visit scheduling, a
  day-by-day schedule view, crew/subcontractor assignment.
- ✅ **Phase 3 — Leads, quoting & invoicing**: lead intake with a structured
  source dropdown, quote builder with line items, invoice generation with
  billing contact info shown, a client-facing summary of each.
- ✅ **Service areas & the GTA map**: every crew has one or more areas of
  operation (Toronto, North York, Scarborough, etc. — these grow
  automatically as new city names are typed in, they aren't a fixed list).
  Leads, quotes, and jobs each show a colored area badge, addresses are
  geocoded automatically (free, no API key) so a "local crew" can be
  suggested, and the **Map** page plots every active job as a pin on a free
  OpenStreetMap map with one-click Google Maps / Apple Maps / Waze
  directions in each pin's popup. Pins are colored by trade (plumbing
  blue, electrical yellow, HVAC green); a property with more than one
  active trade at once gets a single pin split evenly by color instead of
  stacked, overlapping pins, and its popup lists every job there.
- ✅ **Filters** on Jobs, Crews, Leads, Quotes, and Invoices (by trade, area,
  status, or source, wherever relevant).
- ✅ **Contacts directory**: a company-wide address book. Every lead and
  every crew automatically gets a contact card here, and office/admin users
  can add standalone contacts by hand.
- ✅ **Job hub features**: checklists (with reusable, trade-specific
  templates you build once and apply to any job in a click — an item can be
  flagged "photo required" for later), tags/labels, @mention comments that
  notify the tagged person or an entire crew (with a notification bell in
  the header), and inline client/property creation right from the New Job
  form.
- ✅ **Subcontractor scoping**: subcontractor logins can only see and act on
  jobs they (or their crew) are actually assigned to — enforced on the
  server, not just hidden in the menu. A demo subcontractor account is
  included in the seed data (see the login table below). Subs can edit a
  job's description and internal notes on their own assigned jobs, same as
  office staff, but can't reassign crews or see other companies' jobs.
- ✅ **Editable job description & notes**: every job ticket has a
  description box (what the job actually is) and a separate internal notes
  box (gate codes, parking, anything office/field/subs should know) —
  both editable in place, right on the job page.
- ✅ **Directions on the job page**: Google Maps / Apple Maps / Waze links
  sit right next to the job address, using the geocoded coordinates when
  available.
- ✅ **Crew & contact notes**: crews have an internal notes box (reliability,
  preferences, license info) and their assigned jobs link straight to the
  job page. Every contact in the Contacts directory now has its own detail
  page with a notes box too — both are on the creation forms as well, not
  just after the fact.
- ✅ **Crew members without a CRM login**: adding someone to a crew (on the
  New Crew form or an existing crew's page) is one text field — type an
  existing staff member's name to link their real account, or a brand-new
  name to add them as a name-only member (shows up on the crew and the
  schedule, no email/password needed). Renamed "Checklist Templates" to
  **Checklists/SOP** in the sidebar.
- ✅ **Modern UI pass**: refreshed Dashboard (quick-action buttons, accented
  stat cards, hover affordances) and Jobs list (toolbar-style filters,
  trade-colored rows), plus every dropdown in the app was rebuilt as a
  custom-rendered component — fixes a Windows Chrome bug where native
  `<select>` popups silently ignore custom fonts. On mobile, the
  hamburger menu now has the signed-in user's name and Sign out pinned to
  the bottom of the slide-out drawer, and every list page (Jobs, Leads,
  Quotes, Invoices, Contacts, Clients, Team & Settings) switches from a
  data table to a stacked card layout — or at minimum scrolls only the
  table itself — below desktop width (checked down to a 320px-wide
  phone) instead of forcing the whole page to scroll sideways.
- ⏳ **Photo uploads & document storage** (the CompanyCam layer): not built
  yet. This needs your Google Workspace upgrade and Shared Drive set up
  first — see "Setting up Google Drive storage" below for what that will
  involve. The checklist feature already has a "photo required" flag on
  tasks ready for this to plug into.
- ⏳ **Stripe payments, the client portal, reporting, QuickBooks** — not
  built yet.

---

## 1. What you need installed on your computer

You already have these if you're reading this after Claude Code set up the
project, but for reference:

- **Node.js** (v20 or newer) — runs the app on your computer.
- **git** — tracks changes to the code (comes with GitHub Desktop if you'd
  rather use a visual tool instead of the command line).

---

## 2. Setting up your environment file

The app's secrets and connection details (database, login, payments, etc.)
live in a file called `.env` in the project's root folder. This file is
**never** uploaded to GitHub (it's listed in `.gitignore`) — it stays only on
your computer and, later, in your hosting provider's private settings.

1. Find the file `.env.example` in the project folder. It lists every setting
   the app can use, with an explanation of what each one is for.
2. Make a copy of it named exactly `.env` (no `.example` at the end), in the
   same folder.
3. You'll fill in the values step by step as you go through this README —
   you don't need all of them on day one. The **database** section below is
   the one thing you need before the app will run at all.

---

## 3. Setting up the database

The app stores everything (clients, jobs, invoices — everything except photo
files themselves) in a PostgreSQL database. We're using **Neon**
(neon.tech) — a free, managed Postgres host that needs no installation and
plugs directly into Vercel later for hosting.

**This step requires creating a free account. Please do this part yourself —
I won't create accounts or enter passwords on your behalf.**

1. Go to **https://neon.tech** and click **Sign up**. You can sign up with
   Google, GitHub, or an email address — no credit card required for the
   free tier.
2. Once signed in, create a new **Project**. Name it something like
   `gofixcrm`. When it asks for a region, pick whichever is physically
   closest to Ontario (e.g. an "US East" region) — Neon doesn't currently
   have a Canada-based region, but this only affects a few milliseconds of
   latency, not where your data is allowed to live for compliance purposes.
3. After the project is created, Neon shows you a **connection string** —
   a long line of text starting with `postgresql://...`. Click to copy it.
4. Open your `.env` file and paste it in as the value of `DATABASE_URL`,
   replacing the placeholder text. It should look like:
   ```
   DATABASE_URL="postgresql://neondb_owner:AbC123@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
5. Let me know once this is done (or just paste me the connection string in
   chat) and I'll run the database setup for you — this creates all the
   tables and loads some demo data so the app is immediately testable.

You will reuse this same Neon database later when the app is hosted on
Vercel — there's no need to create a second one.

### What I run once you have a connection string

```bash
npx prisma migrate dev --name init
npm run db:seed
```

The first command creates every table described in `prisma/schema.prisma`.
The second loads demo data: one company (GoFix Services), three staff
logins, two demo clients with contacts/properties, and two demo jobs.

**Demo logins** (all use the password `password123` — change these before
using the app for real):

| Role         | Email                              |
|--------------|-------------------------------------|
| Admin        | admin@gofixservices.ca             |
| Office       | office@gofixservices.ca            |
| Field        | field@gofixservices.ca             |
| Subcontractor| sub@brightsparkelectric.example    |

The subcontractor login belongs to a demo crew ("BrightSpark Electric")
that's only assigned to one seed job — sign in as this user to see how
restricted the subcontractor view is: no client list, no other crews' jobs,
no company financials, just their own assigned work.

---

## 4. Running the app on your computer

Once `.env` has a working `DATABASE_URL`:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser and sign in with one of
the demo logins above.

---

## 5. Setting up Google Sign-In for staff (optional)

Staff can always sign in with email + password. If you'd also like a
"Sign in with Google" button:

1. Go to **https://console.cloud.google.com** and sign in with the GoFix
   Google Workspace account.
2. Create a new project (top-left project dropdown → **New Project**), name
   it e.g. "GoFix CRM".
3. In the search bar, go to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth client ID**. If prompted, configure the
   "OAuth consent screen" first (Internal, if available on your Workspace —
   this restricts sign-in to your own company's Google accounts).
5. Application type: **Web application**. Add this to "Authorized redirect
   URIs":
   - `http://localhost:3000/api/auth/callback/google` (for local testing)
   - `https://your-real-domain.com/api/auth/callback/google` (once hosted)
6. Copy the **Client ID** and **Client Secret** into `.env` as
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

This step is entirely optional and can be skipped or done later — nothing
else depends on it.

---

## 6. Setting up Google Drive storage (needed before Phase 3 — photos)

**Do not start this section until:**
1. GoFix has finished upgrading from a personal Google account to a paid
   **Google Workspace** (business) plan, and
2. You've confirmed with me that the upgrade is complete.

Photo and document files will live in Google Drive, not in the database —
the database only stores a pointer to each file (its Drive ID) plus GPS
coordinates and a timestamp. This section will be filled in with exact,
click-by-click steps for:

- Creating a Google Cloud project and enabling the Drive API.
- Creating a **service account** (a robot account the app uses instead of
  any one person's login, so uploads don't break when someone's session
  expires).
- Creating a dedicated **Shared Drive** for GoFix and giving that service
  account access to it.
- Adding the service account's credentials to `.env` — never to the GitHub
  repo.

This section is intentionally left as a placeholder until the Workspace
upgrade is confirmed and we build the photo-upload feature.

---

## 7. Setting up Stripe (needed before Phase 4 — invoicing/payments)

Not needed yet. When we get there: you'll create a free Stripe account at
**https://stripe.com**, and I'll walk you through finding your test-mode API
keys to put in `.env`. No credit card processing happens until you
deliberately switch Stripe from test mode to live mode.

---

## 8. Deploying the live site (Vercel) — later

Not needed yet either. In short: Vercel hosts the app itself (free tier is
enough to start), and it connects directly to the same Neon database you set
up above. I'll walk through account creation and the exact deploy steps when
we get to this phase — nothing here happens automatically.

---

## Everyday use

- `npm run dev` — start the app locally to make changes or test something.
- `npm run db:studio` — opens a visual browser-based table editor for the
  database (handy for spot-checking data without writing any SQL).
- `npm run db:migrate` — after the database schema changes, this updates
  your database to match and gives the change a name.

---

## Project structure

```
prisma/
  schema.prisma       The full database design (every table & field)
  migrations/          Hand-tracked, ordered database changes
  seed.ts              Demo data loaded by `npm run db:seed`
src/
  app/
    login/             Staff sign-in page
    (dashboard)/        Everything behind login: dashboard, clients, jobs,
                         schedule, crews, contacts (incl. a per-contact
                         detail/notes page), map, checklist templates,
                         team settings
    actions/            Server-side functions that create/update records
    api/auth/            Login/session plumbing (Auth.js)
  components/
    ui/                 Small reusable building blocks (buttons, form fields,
                         cards, the custom dropdown used everywhere in place
                         of a native <select>, the URL-based filter dropdown,
                         the Google/Apple Maps/Waze directions links)
    layout/              The sidebar/header shell, mobile nav drawer,
                         notification bell
    jobs/                Job-hub bits: checklist editor, comment composer
                         with @mention autocomplete, schedule-visit button
    map/                 The Leaflet active-jobs map
  lib/                   Database client, auth config, shared helpers —
                         including jobAccess.ts (subcontractor scoping),
                         serviceArea.ts, geocode.ts
.env.example             Every environment variable, explained
```

## Tech stack

Next.js (React + TypeScript) · PostgreSQL · Prisma · Auth.js · Tailwind CSS ·
Leaflet + OpenStreetMap (free active-jobs map, no API key) · Nominatim (free
address geocoding) · Google Drive API (planned) · Stripe (planned) · hosted
on Vercel + Neon (planned)
