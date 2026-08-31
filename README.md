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
- ⏳ **Phase 3 — Photo documentation** (the CompanyCam layer): not built yet.
  This needs your Google Workspace upgrade and Shared Drive set up first —
  see "Setting up Google Drive storage" below for what that will involve.
- ⏳ **Phase 4 onward** — quoting, invoicing/Stripe payments, the client
  portal, comments/tasks, reporting, QuickBooks — not built yet.

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

| Role   | Email                      |
|--------|-----------------------------|
| Admin  | admin@gofixservices.ca      |
| Office | office@gofixservices.ca     |
| Field  | field@gofixservices.ca      |

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
  seed.ts              Demo data loaded by `npm run db:seed`
src/
  app/
    login/             Staff sign-in page
    (dashboard)/        Everything behind login: dashboard, clients, jobs,
                         schedule, crews, team settings
    actions/            Server-side functions that create/update records
    api/auth/            Login/session plumbing (Auth.js)
  components/
    ui/                 Small reusable building blocks (buttons, form fields, cards)
    layout/              The sidebar/header shell
    jobs/                Job-specific interactive bits
  lib/                   Database client, auth config, shared helpers
.env.example             Every environment variable, explained
```

## Tech stack

Next.js (React + TypeScript) · PostgreSQL · Prisma · Auth.js · Tailwind CSS ·
Google Drive API (planned) · Stripe (planned) · hosted on Vercel + Neon
(planned)
