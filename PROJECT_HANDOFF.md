# Client Pipeline Manager - Project Handoff

Paste this whole file into a new chat so it has full context on what's built, how this
project works, and the hard-won gotchas from building it. See also
[README.md](README.md) (setup instructions).

## What this is

Internal sales/client pipeline tracker for a 2-3 person team. Next.js 16 (App Router) +
TypeScript + Tailwind CSS v4, backed by Supabase (Postgres, Auth, Storage, RLS). Deployed
on Vercel, auto-deploys on every push to `master`.

- **Repo**: https://github.com/sxndinnnnn/client-pipeline-manager
- **Production**: https://client-pipeline-manager.vercel.app/
- **Supabase project**: `wloirrmjjjmfowqfdxik` (dashboard:
  https://supabase.com/dashboard/project/wloirrmjjjmfowqfdxik)

## Status: original MVP long since surpassed by follow-up work

The original Phase 1 build (clients, contacts, pipeline board, deal detail, System Log)
is done and in use, plus a long list of follow-up features and fixes (full list below).
Phase 2 items from the original spec (CSV import/export, global search) have **not**
been started.

## Environment setup

```bash
npm install
cp .env.local.example .env.local   # fill in the Supabase values below
npm run dev
```

`.env.local` needs (get from Supabase dashboard → Project Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://wloirrmjjjmfowqfdxik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
These are gitignored - ask the user for them, don't assume they're available. The anon
key is safe to use client-side (that's its purpose); RLS is the actual access control.
The service-role key is server-only and must never be exposed to the client.

**A service-role key exists and is wired into `src/lib/supabase/admin.ts`.** It is used
exclusively for Supabase Auth admin operations in Settings > Users (inviting/removing
teammates) - nowhere else. Everything else still goes through the regular server client
and RLS. Claude still cannot execute DDL directly; every schema change goes out as a
migration file the *user* runs manually in the Supabase SQL Editor. If this key is ever
pasted into chat, do not echo it back - write it straight to `.env.local` and recommend
the user rotate it in the Supabase dashboard.

## Tech stack & conventions

- **Next.js 16 App Router**, Server Components by default, Server Actions for all
  mutations (no API routes). `src/proxy.ts` is Next 16's replacement for
  `middleware.ts` - it delegates to `src/lib/supabase/middleware.ts` which protects every
  route except `/login`.
- **Supabase**: direct `@supabase/supabase-js` / `@supabase/ssr` calls, no ORM. Server
  client (`src/lib/supabase/server.ts`, used in Server Components/Actions), an admin
  client (`src/lib/supabase/admin.ts`, service-role, server-only, Settings > Users only),
  and the middleware session-refresh helper are kept deliberately separate. There is no
  browser Supabase client - every data operation goes through Server Components/Actions.
  The `Database` generic type is **not** wired into the Supabase client generics (caused
  every query to infer as `never` - see Gotchas); types in `src/types/database.ts` are
  used for manual casts instead.
- **Tailwind v4 with a real semantic token system** in `src/app/globals.css` - CSS custom
  properties (`--background`, `--surface`, `--surface-sunken`, `--foreground`, `--muted`,
  `--subtle`, `--border`, `--border-strong`, `--primary`, `--primary-foreground`,
  `--secondary`, `--success`, `--warning`, `--error`, plus shadow tokens
  `--shadow-resting`/`--shadow-raised`/`--shadow-floating`), each redefined under `.dark`.
  Brand color (`#19a59b` aqua, matching the actual logo) is the primary token. Components
  use the generated utilities (`bg-surface`, `text-muted`, `border-border`,
  `shadow-raised`, etc.) - never raw `zinc-*`/`blue-*`/`green-*` Tailwind colors. Dark
  mode is class-based, not automatic - see Gotchas.
- **Shared icon library**: `src/components/icons.tsx` exports every icon used in the app
  (`viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}`, default
  `className="h-4 w-4"`). Icons are not duplicated per-file - always check this module
  before adding a new inline SVG.
- **Currency is LKR**, not USD - `src/lib/currency.ts`'s `formatLKR()` is used everywhere
  a deal value is displayed.
- **Timezone is Asia/Colombo** for any displayed timestamp (System Log, activity
  timestamps, etc.) - dates are formatted with an explicit `timeZone: "Asia/Colombo"`
  rather than relying on the server/client's local timezone.
- **Modals**: native `<dialog>` + `showModal()`/`.close()`, not a UI library. See the
  "Modal pattern" gotcha below before touching any of these - it's easy to reintroduce
  bugs that look fine at a glance.
- **Git workflow established with this user**: commit directly to `master`, no PR review
  requested so far. Always run `npm run build` and `npm run lint` clean before
  committing. Always end commits with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
  Never push without asking the user first, even after prior pushes were approved.

## Standing rule: every release updates Release Note

**This is a durable instruction from the user, not optional.** For every change that
ships, add a row to `changelog_entries` via a new numbered migration in
`supabase/migrations/` (title, short description, category: `feature`/`fix`/
`improvement`). This is what shows on the in-app **Release Note** page (`/release-note`
route - the `changelog_entries` table name is unchanged, only the UI label and route
have moved away from "changelog"). Purely internal/invisible changes (refactors,
CSS-only fixes with no behavior change, dead-code removal) still need a changelog entry,
just a short one describing the internal cleanup.

There used to also be a "Guide" page that this same rule updated - **it has been removed
entirely** (UI only, no database table backed it), so that half of the rule no longer
applies.

Do this in the same turn as the feature/fix itself, without being asked.

## Migrations

`supabase/migrations/0001` through `0090` exist as of this handoff (90 files - many are
tiny single-INSERT changelog-entry migrations that always follow the "real" migration
for that change). **Ask the user to confirm which ones have actually been run** in their
Supabase SQL Editor - Claude has no way to check this directly, and in this project's
history the user has sometimes taken a few messages to catch up on running them. New
migrations must be run **in numeric order**.

Naming convention: `NNNN_description.sql` for schema/data changes,
`NNNN_changelog_<slug>.sql` for the paired changelog-entry insert.

Current schema (post-cleanup):
- `clients`, `contacts`, `pipeline_stages`, `deals`, `activities` - core pipeline tables.
  `deals.plan_id` references `plans` (nullable - a deal need not have a plan).
- `plans` - named pricing plans with a fixed amount, managed from Settings > Plans.
- `industries` - client industry tags, managed from Settings > Industries.
- `audit_log` - append-only (no update/delete RLS policy), records every mutating action
  with actor email, IP, and geolocation (from Vercel's `x-vercel-ip-*` edge headers, so
  location is only populated in production, not local dev). Written via
  `src/lib/audit-log.ts`'s `logAudit()`, called from nearly every server action.
- `changelog_entries` - backs the Release Note page.
- `clients.logo_url`, `clients.created_by_email`, `clients.updated_by_email` - added
  after the original schema.
- `deals` has a `move_deal_stage(p_deal_id, p_stage_id)` Postgres function (used by the
  pipeline board drag-and-drop) - originally took a caller-supplied `p_actor_id`
  parameter, which was a real security bug (anyone with a valid session could attribute
  an activity note to an arbitrary other user via direct RPC call, bypassing the app
  entirely); fixed in migration 0007 to derive the actor from `auth.uid()` server-side.
- Storage bucket `client-logos` (public read, authenticated write) for client logo
  uploads.
- `tasks` **has been dropped entirely** (migration `0086_drop_tasks.sql`) - the Tasks
  feature (standalone view + per-deal task list) was removed from the app. Do not
  reintroduce references to it.

## Feature list (everything built beyond the original Phase 1 spec)

- System audit log (`/system-log`) - IP + geolocation, append-only.
- Release Note (`/release-note`) - in-app changelog, no longer user-editable (the "+ Add
  entry" form was removed; entries only come from migrations now).
- Dark mode - toggle in the header, defaults to system preference on first visit,
  persisted choice after that (`localStorage`), not automatic OS-following.
- A full design-token system and brand color rollout (see "Tech stack" above) replacing
  raw Tailwind colors app-wide, plus a shared icon library and a three-tier elevation
  system (resting/raised/floating shadows).
- Redesigned login page, navbar (centered nav links, pill hover, avatar account menu via
  `UserMenu` replacing a plain email + logout icon), and dashboard.
- Client logo upload/remove (Supabase Storage).
- Clients list pagination (`?page=`, `?pageSize=`, composes with `?q=` search).
- Client detail page redesign: header card (avatar, stat cards including Won/Lost
  Pipeline Value, Created/Updated by + date), tabs (Details/Contacts/Deals), Contacts and
  Deals as tables with modal-based add/view/edit instead of the original inline
  `<details>` popovers.
- Deal detail modal (opened from the client's Deals table) with inline edit toggle and
  delete - separate from (but currently redundant with) the standalone `/deals/[id]`
  page, which still exists.
- Two extra pipeline stages (Trial, Legal) between Negotiation and Won.
- **Settings** (`/settings`) - Plans, Industries, Pipeline Stages, and Users management.
  Users management uses `src/lib/supabase/admin.ts` (service-role) to invite/remove
  teammates via the Supabase Auth admin API, replacing the old "invite from the Supabase
  dashboard directly" workflow.
- **Reports** (`/reports`) - built as an extensible report generator. First report is
  Gain/Loss (`gain-loss-report.tsx`): customer, deal, plan, plan amount, actual amount,
  gain/loss, and plan start date (the date the deal moved to Won).
- **Tasks removed entirely** - both the standalone `/tasks` view and per-deal tasks were
  removed from the UI, and the `tasks` table was dropped from the database.
- **Guide removed entirely** - the `/guide` static walkthrough page was removed; there
  was no database table behind it.
- A security audit was run partway through (see git log around "security audit") that
  found and fixed the `move_deal_stage` actor-spoofing issue above and an open-redirect
  vulnerability in the post-login `redirectTo` handling (`src/app/login/actions.ts` now
  validates it's a same-origin relative path before redirecting).

## Gotchas - read before touching modals, dark mode, or middleware

These cost real debugging time. Future sessions should not have to rediscover them.

1. **`<dialog>` centering**: the browser's native `dialog:modal { margin: auto; }`
   centering trick breaks if `<body>` is `display: flex` (ours is, for the sticky
   footer) and the dialog is portaled there via `createPortal(..., document.body)` -
   which every modal in this app does. Fix in use: the `<dialog>` itself is a
   `fixed inset-0` full-viewport flex container that centers a plain inner `<div>` card,
   not reliant on the browser default at all.

2. **CSS cascade origin beats specificity**: putting `flex` directly on the `<dialog>`
   element (to implement the fix above) *permanently* overrides the browser's own
   `dialog:not([open]) { display: none }` rule - **author stylesheets always win over
   user-agent stylesheets for normal-weight declarations, regardless of specificity.**
   This caused every modal to render visible on page load, before any click, for one
   full release. Current fix: `hidden` as the base Tailwind class, `open:flex`
   (Tailwind's `[open]` attribute variant) to switch to flex only once `.showModal()`
   sets the `open` attribute. If you ever touch a dialog's className, keep this pattern
   - don't put an unconditional `display` utility on it.

3. **Portaled dialogs in table rows**: `<dialog>` can't legally nest inside `<tr>`.
   `ContactRow` and `DealRow` render their edit/view dialogs via
   `createPortal(..., document.body)`, gated behind a `mounted` state flag (portal target
   doesn't exist during SSR) - same pattern as `ThemeToggle`'s hydration-safe mount
   check.

4. **Keyed rows can inherit stale dialog state**: `ContactRow`/`DealRow` are keyed by
   `contact.id`/`deal.id`. If the browser or Next's router reuses that exact component
   instance across a navigation instead of a fresh mount, a `<dialog>`'s `open` state
   (native DOM state, outside React's model) can resurface from an earlier interaction.
   Both components have a defensive `useEffect` that force-closes the dialog once it
   exists in the DOM, regardless of inherited state - it should only ever open from an
   explicit click.

5. **Outside-click-to-close**: with the current full-viewport-dialog pattern, the check
   is simply `if (e.target === dialogRef.current) close()` in the dialog's own `onClick`
   - since the dialog element itself *is* the backdrop area now, no bounding-rect math
   needed (an earlier version used `getBoundingClientRect()`, which is unnecessary now).

6. **`Database` generic + Supabase client**: passing the hand-written `Database` type
   into `createServerClient<Database>()` made every query result infer as `never`,
   because the type didn't match every field Supabase's generics expect. The server and
   admin clients are untyped generics-wise; `src/types/database.ts`'s row types are used
   for manual `as` casts at call sites instead.

7. **Dark mode is opt-in only, never automatic-after-first-load**: an early version let
   `prefers-color-scheme` silently flip styles via `@media`, and most components weren't
   actually dark-aware, producing invisible white-on-white text. Current setup:
   `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` (class-based, not
   media-query-based) + an inline anti-flash script in the root layout that reads
   `localStorage` (falling back to system preference **only on first visit**, before any
   explicit toggle) and sets the `.dark` class before paint.

8. **Edge/Chromium's native password-reveal icon**: `input[type="password"]` gets a
   built-in reveal icon in Edge via `::-ms-reveal`, which stacks with any custom
   show/hide toggle button. Hidden globally in `globals.css`
   (`input[type="password"]::-ms-reveal, ::-ms-clear { display: none; }`).

## How Claude verified UI changes in this project (no login credentials available)

Claude cannot log in to the app (entering account passwords is off-limits regardless of
who provides them) and the deployed/dev session here has an **intermittent, unexplained
redirect to `/login`** that can leave a *stale-looking* screenshot on screen after a
silent navigation - always sanity-check `window.location.href` via the JS-exec tool
before trusting a screenshot if something looks wrong.

Established workaround for testing anything gated behind auth:
1. Temporarily add the real route (or a throwaway one) to `PUBLIC_PATHS` in
   `src/lib/supabase/middleware.ts`.
2. Load it in the browser preview. Note that Supabase RLS still applies even with the
   middleware bypass and there's no anon-session access to real rows, so these pages
   render their **empty states**, not populated data - sufficient for verifying layout,
   tokens, dark mode, and modal/form styling, not for populated table/card rendering.
3. `rm -rf .next` and rebuild before testing if a route was just added/removed - stale
   HMR/route-validator state has caused false positives/negatives more than once.
4. For anything involving CSS display/visibility, check `getComputedStyle(el).display`
   directly via the JS-exec tool, not just a screenshot - a screenshot alone previously
   missed a "modal always visible" regression because it only captured the *open* state
   looking correct.
5. Revert the `PUBLIC_PATHS` change (and delete any throwaway scratch route) before
   committing - never ship the test scaffolding.

## Key files

- `src/proxy.ts`, `src/lib/supabase/middleware.ts` - route protection
- `src/lib/supabase/server.ts` - regular Supabase server client factory
- `src/lib/supabase/admin.ts` - service-role admin client, used only by Settings > Users
- `src/lib/audit-log.ts` - `logAudit()`, called from most mutating server actions
- `src/lib/currency.ts` - `formatLKR()`
- `src/types/database.ts` - hand-written row types (see Gotcha #6 on why they're not
  wired into the Supabase client generics)
- `src/components/icons.tsx` - shared icon library, all icons used in the app
- `src/components/theme-toggle.tsx` - dark mode toggle + the hydration-safe mount
  pattern reused by ContactRow/DealRow
- `src/components/user-menu.tsx` - avatar account menu in the header (replaces the old
  plain email + logout icon)
- `src/app/(dashboard)/layout.tsx` - header nav + fixed footer (System Log/Release Note
  live in the footer, not the top nav)
- `src/app/(dashboard)/clients/[id]/` - client detail page and its modals (add-contact,
  add-deal, contact-row, deal-row, client-logo, client-tabs)
- `src/app/(dashboard)/pipeline/board.tsx` - drag-and-drop kanban (`@dnd-kit/core`)
- `src/app/(dashboard)/settings/` - Plans, Industries, Pipeline Stages, Users panels
- `src/app/(dashboard)/reports/` - report generator, starting with Gain/Loss

## Non-goals (still true, per the original build plan)

No role-based permissions, no multi-tenancy, no email/calendar integration, no mobile
app, no notifications, no billing. Everyone with a login has full access to everything
(flat access model) - this is intentional, not a gap, for a 2-3 person internal team.
