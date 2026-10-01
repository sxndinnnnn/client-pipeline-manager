# Client Pipeline Manager

Internal sales/client pipeline tracker for a 2-3 person team. Next.js 16 (App Router) +
TypeScript + Tailwind CSS v4, backed by Supabase (Postgres, Auth, Storage, RLS). Deployed
on Vercel in the Tokyo region (next to the Supabase database), auto-deploys on every push
to `master`.

- **Repo**: https://github.com/sxndinnnnn/client-pipeline-manager
- **Production**: https://client-pipeline-manager.vercel.app/
- **Supabase project**: `wloirrmjjjmfowqfdxik` (dashboard:
  https://supabase.com/dashboard/project/wloirrmjjjmfowqfdxik)

This file is both the setup guide and the project context (what's built, conventions,
gotchas). If you are an AI assistant starting a new session, read all of it first.

## Status

The original Phase 1 build (clients, contacts, pipeline board, deal detail) is done and in
use, plus a long list of follow-up features and fixes (see [Features](#features)). Phase 2
items from the original spec (CSV import/export, global search) have **not** been started.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migrations**: open the SQL Editor in your Supabase dashboard and run every
   file in `supabase/migrations/`, **in numeric order** (`0001_...` through the highest
   numbered file present).
3. **Set environment variables**: copy `.env.local.example` to `.env.local` and fill in
   your project's values (Project Settings → API in the Supabase dashboard):

   ```bash
   cp .env.local.example .env.local
   ```

   You'll need:
   - `NEXT_PUBLIC_SUPABASE_URL` (`https://wloirrmjjjmfowqfdxik.supabase.co` for this project)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - safe to use client-side (that's its purpose); RLS is
     the actual access control
   - `SUPABASE_SERVICE_ROLE_KEY` - server-only, used exclusively by Settings > Users for
     Supabase Auth admin operations (inviting/removing users). Keep this out of any
     client-visible code path.

   These are gitignored. If the service-role key is ever pasted into chat, do not echo it
   back - write it straight to `.env.local` and rotate it in the Supabase dashboard.

4. **Invite your team**: there's no self-signup. Add teammates from Settings > Users in
   the app (backed by the service-role key above), or directly from the Supabase
   dashboard under Authentication → Users.
5. **Run the app**:

   ```bash
   npm install
   npm run dev
   ```

   Visit http://localhost:3000 - you'll land on `/login`.

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new) and set the function region to Tokyo
   (`hnd1`) so it sits next to the Supabase database.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` as environment variables in the Vercel project settings.
4. Deploy, then verify the production build against your Supabase project.

## Tech stack & conventions

- **Next.js 16 App Router**, Server Components by default, Server Actions for all
  mutations (no API routes). `src/proxy.ts` is Next 16's replacement for
  `middleware.ts` - it delegates to `src/lib/supabase/middleware.ts`, which protects every
  route except `/login`. Read the relevant guide in `node_modules/next/dist/docs/` before
  writing Next-specific code; this version has breaking changes (see `AGENTS.md`).
- **Supabase**: direct `@supabase/supabase-js` / `@supabase/ssr` calls, no ORM. Server
  client (`src/lib/supabase/server.ts`, used in Server Components/Actions), an admin
  client (`src/lib/supabase/admin.ts`, service-role, server-only, Settings > Users only),
  and the middleware session-refresh helper are kept deliberately separate. There is no
  browser Supabase client - every data operation goes through Server Components/Actions.
  The `Database` generic type is **not** wired into the Supabase client generics (see
  Gotcha 6); types in `src/types/database.ts` are used for manual casts instead.
- **Auth lookups**: `getCurrentUser()` in `src/lib/supabase/current-user.ts` verifies the
  session JWT locally (`auth.getClaims()`) and is request-cached; the middleware uses
  `getClaims()` too. Avoid `auth.getUser()` - it's a network round trip to Tokyo.
- **Server action errors are masked in production** (React error 441). Actions that a form
  needs readable errors from should return `{ error }` instead of throwing (see
  `settings/targets-actions.ts`).
- **Tailwind v4 with a real semantic token system** in `src/app/globals.css` - CSS custom
  properties (`--background`, `--surface`, `--surface-sunken`, `--foreground`, `--muted`,
  `--subtle`, `--border`, `--border-strong`, `--primary`, `--primary-foreground`,
  `--secondary`, `--success`, `--warning`, `--error`, a categorical `--chart-1..8`
  palette, plus shadow tokens `--shadow-resting`/`--shadow-raised`/`--shadow-floating`),
  each redefined under `.dark`. Brand color (`#19a59b` aqua, matching the logo) is the
  primary token. Components use the generated utilities (`bg-surface`, `text-muted`,
  `border-border`, `shadow-raised`, etc.) - never raw `zinc-*`/`blue-*`/`green-*` Tailwind
  colors. Dark mode is class-based, not automatic - see Gotcha 7.
- **Shared icon library**: `src/components/icons.tsx` exports every icon used in the app
  (`viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}`, default
  `className="h-4 w-4"`). Always check this module before adding a new inline SVG.
- **Currency is LKR** (with USD alongside on deals) - `src/lib/currency.ts`'s `formatLKR()`
  / `formatUSD()` are used everywhere a deal value is displayed.
- **Timezone is Asia/Colombo** for any displayed timestamp and for dashboard month/year
  boundaries - dates are formatted with an explicit `timeZone: "Asia/Colombo"` rather than
  relying on the server/client's local timezone.
- **Modals**: native `<dialog>` + `showModal()`/`.close()`, not a UI library. Read the
  gotchas below before touching any of these.
- **Git workflow**: commit directly to `master` and push automatically (no PR review). Always
  run `npm run build` and `npm run lint` clean before committing, and end commits with the
  `Co-Authored-By` attribution line.

## Migrations

`supabase/migrations/0001` through `0137` exist. Claude has no way to execute DDL: every
schema change goes out as a migration file that **the user runs manually** in the Supabase
SQL Editor, **in numeric order**. Ask which ones have actually been run before assuming
the schema is current. Naming: `NNNN_description.sql`.

Many of the files from `0003` onward were single-INSERT release-note entries for a
Release Note page that has since been removed; migration `0137` drops that table.

Current schema:
- `clients`, `contacts`, `pipeline_stages`, `deals`, `activities` - core pipeline tables.
  `deals.plan_id` references `plans` (nullable - a deal need not have a plan);
  `deals.owner_id` is set to the creator; `deals.value` is LKR, `deals.value_usd` is USD.
- `plans` - named pricing plans with a fixed amount, managed from Settings > Plans.
- `industries` - client industry tags, managed from Settings > Industries.
- `user_profiles` - name/position/email per auth user, shown in Settings > Users.
- `clients.logo_url`, `clients.is_active`, `clients.created_by_email`,
  `clients.updated_by_email` - added after the original schema.
- `pipeline_stages.kind` (`PENDING` / `IN_PROGRESS` / `WON` / `LOST`) drives deal status;
  `pipeline_stages.win_probability` feeds weighted-pipeline math.
- `deals.lost_reason` - captured when a deal is dropped into a Lost stage.
- `deals.plan_amount_lkr` / `plan_amount_usd` - the plan price frozen when a plan is set on a deal
  (0138), so editing a plan in Settings does not rewrite past Gain/Loss rows.
- `deal_stage_events` - stage history, written by `move_deal_stage()` and an insert trigger
  on `deals`.
- `sales_targets` - one yearly LKR revenue target per year (Settings > Targets).
- `move_deal_stage(p_deal_id, p_stage_id, p_lost_reason default null)` Postgres function
  (used by the pipeline board drag-and-drop). It once took a caller-supplied `p_actor_id`,
  which was a real security bug (any session could attribute an activity note to another
  user via direct RPC); migration 0007 fixed it to derive the actor from `auth.uid()`.
- Storage bucket `client-logos` (public read, authenticated write) for client logos.
- **Removed, do not reintroduce unless asked**: `tasks` (migration 0086), `audit_log`
  (0135), `changelog_entries` (0137).

## Features

- **Dashboard** (`/dashboard`) - all-time KPI dashboard: Open / Closed / Lost pipeline value
  (LKR | USD) and win rate (with won/closed deal counts) scorecards, a per-stage pipeline
  chart (Won green, Lost red, other stages coloured from the chart palette), Won vs Lost
  by month and Cumulative Revenue vs Target for the current year (both with hover
  amounts), and client panels (active/inactive, top clients by open and won value). Math
  lives in `src/lib/dashboard/metrics.ts` + `period.ts`; UI blocks in
  `src/app/(dashboard)/dashboard/ui.tsx`. Dropping a deal into a Lost stage asks for a
  reason; Settings > Targets sets the yearly target; stage edit sets win probability.
- **Clients** - list with pagination (`?page=`, `?pageSize=`, composes with `?q=` search) and
  Activate/Deactivate; logo upload/remove (Supabase Storage); detail page with header card,
  stat cards, tabs (Details/Contacts/Deals), Contacts and Deals as tables with modal-based
  add/view/edit.
- **Pipeline** - drag-and-drop kanban (`@dnd-kit/core`); deal detail modal and a standalone
  `/deals/[id]` page with an activity log. Two extra stages (Trial, Legal) sit between
  Negotiation and Won.
- **Settings** (`/settings`) - Plans, Industries, Pipeline Stages, Targets, and Users
  management. Users management uses the service-role admin client to invite/remove
  teammates via the Supabase Auth admin API.
- **Reports** (`/reports`) - extensible report generator. First report is Gain/Loss
  (`gain-loss-report.tsx`): customer, stage, plan, plan amount, actual amount, gain/loss in
  LKR and USD, and plan start date (the date the deal moved to Won).
- Dark mode (header toggle; defaults to system preference on first visit, then the
  persisted choice), a full design-token system, a redesigned login page, navbar with an
  avatar account menu (`UserMenu`), and a three-tier elevation system.
- Security audit done partway through: fixed the `move_deal_stage` actor-spoofing issue and
  an open-redirect in the post-login `redirectTo` handling (`src/app/login/actions.ts`
  validates it's a same-origin relative path).
- **Removed entirely**: Tasks, Guide page, System Log / audit trail, Release Note page.

## Project structure

- `supabase/migrations/` - schema, RLS policies, and data migrations, run in order
- `src/lib/supabase/` - server client, admin (service-role) client, `current-user.ts`, and
  the session-refresh middleware
- `src/lib/dashboard/` - dashboard metrics and Colombo-time month helpers
- `src/lib/currency.ts`, `src/lib/datetime.ts`, `src/lib/loss-reasons.ts` - formatting and
  shared constants
- `src/types/database.ts` - hand-written row types (see Gotcha 6)
- `src/proxy.ts` - route protection (redirects unauthenticated users to `/login`)
- `src/components/` - shared UI (`icons.tsx`, `theme-toggle.tsx` and its hydration-safe
  mount pattern reused by ContactRow/DealRow, `user-menu.tsx`, ...)
- `src/app/login/` - auth
- `src/app/(dashboard)/layout.tsx` - header nav
- `src/app/(dashboard)/dashboard/` - KPI dashboard
- `src/app/(dashboard)/clients/` - clients list + detail (`[id]/` has the add-contact,
  add-deal, contact-row, deal-row, client-logo and client-tabs components)
- `src/app/(dashboard)/pipeline/` - kanban board
- `src/app/(dashboard)/deals/[id]/` - deal detail, activity log
- `src/app/(dashboard)/reports/` - report generator (Gain/Loss, extensible)
- `src/app/(dashboard)/settings/` - Plans, Industries, Pipeline Stages, Targets, Users

## Gotchas - read before touching modals, dark mode, or middleware

These cost real debugging time.

1. **`<dialog>` centering**: the browser's native `dialog:modal { margin: auto; }`
   centering trick breaks if `<body>` is `display: flex` and the dialog is portaled there
   via `createPortal(..., document.body)` - which every modal in this app does. Fix in
   use: the `<dialog>` itself is a `fixed inset-0` full-viewport flex container that
   centers a plain inner `<div>` card, not reliant on the browser default at all.

2. **CSS cascade origin beats specificity**: putting `flex` directly on the `<dialog>`
   *permanently* overrides the browser's own `dialog:not([open]) { display: none }` rule -
   author stylesheets always win over user-agent stylesheets for normal-weight
   declarations, regardless of specificity. This once made every modal render visible on
   page load. Current fix: `hidden` as the base Tailwind class and `open:flex` to switch to
   flex only once `.showModal()` sets the `open` attribute. If you touch a dialog's
   className, keep this pattern - don't put an unconditional `display` utility on it.

3. **Portaled dialogs in table rows**: `<dialog>` can't legally nest inside `<tr>`.
   `ContactRow` and `DealRow` render their edit/view dialogs via
   `createPortal(..., document.body)`, gated behind a `mounted` state flag (the portal
   target doesn't exist during SSR) - same pattern as `ThemeToggle`'s hydration-safe mount
   check.

4. **Keyed rows can inherit stale dialog state**: `ContactRow`/`DealRow` are keyed by
   `contact.id`/`deal.id`. If the router reuses that exact component instance across a
   navigation, a `<dialog>`'s native `open` state can resurface from an earlier
   interaction. Both components have a defensive `useEffect` that force-closes the dialog
   once it exists in the DOM - it should only ever open from an explicit click.

5. **Outside-click-to-close**: with the full-viewport-dialog pattern the check is simply
   `if (e.target === dialogRef.current) close()` in the dialog's own `onClick` - the
   dialog element itself is the backdrop area, so no bounding-rect math is needed.

6. **`Database` generic + Supabase client**: passing the hand-written `Database` type into
   `createServerClient<Database>()` made every query result infer as `never`. The server
   and admin clients are untyped generics-wise; row types in `src/types/database.ts` are
   used for manual `as` casts at call sites instead.

7. **Dark mode is opt-in only, never automatic after first load**: an early version let
   `prefers-color-scheme` silently flip styles via `@media`, and most components weren't
   dark-aware, producing invisible white-on-white text. Current setup:
   `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` (class-based) + an
   inline anti-flash script in the root layout that reads `localStorage` (falling back to
   system preference only on first visit) and sets the `.dark` class before paint.

8. **Edge/Chromium's native password-reveal icon**: `input[type="password"]` gets a
   built-in reveal icon in Edge via `::-ms-reveal`, which stacks with the custom show/hide
   toggle. Hidden globally in `globals.css`.

9. **Chart tooltips get clipped**: the dashboard charts sit in `overflow-x-auto`
   containers, which also clip vertically. Tooltips above the tallest bar need headroom
   inside the container (the charts use `pt-16`).

## Verifying UI changes without login credentials

Claude cannot log in to the app (entering account passwords is off-limits regardless of who
provides them) and the deployed/dev session has an intermittent redirect to `/login` that
can leave a stale-looking screenshot - check `window.location.href` before trusting one.

Workaround for testing anything gated behind auth:
1. Temporarily add the route to `PUBLIC_PATHS` in `src/lib/supabase/middleware.ts`.
2. Load it in the browser preview. RLS still applies, so pages render their **empty
   states** - enough for layout, tokens, dark mode and modal/form styling, not populated
   tables or charts.
3. `rm -rf .next` and rebuild before testing if a route was just added or removed - stale
   route-validator state has caused false positives/negatives.
4. For CSS display/visibility, check `getComputedStyle(el).display` rather than only a
   screenshot.
5. Revert the `PUBLIC_PATHS` change (and delete any scratch route) before committing.

## Non-goals

No role-based permissions, no multi-tenancy, no email/calendar integration, no mobile app,
no notifications, no billing. Everyone with a login has full access to everything (flat
access model) - intentional for a 2-3 person internal team.
