# Client Pipeline Manager

Internal sales/client pipeline tracker for a 2-3 person team. Next.js 14+ (App Router) +
TypeScript + Tailwind, backed by Supabase (Postgres, Auth, RLS). See
[pipeline-manager-build-plan.md](pipeline-manager-build-plan.md) for the full spec.

## Status

Phase 1 (MVP) is built and deployed: login, clients + contacts, pipeline board with
drag-and-drop, deal detail with activity log + tasks, the standalone tasks view, and a
System Log audit trail (every mutating action, with the actor, IP address, and
geolocation).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migrations**: open the SQL Editor in your Supabase dashboard and run each
   file in `supabase/migrations/` **in order**:
   - [`0001_init.sql`](supabase/migrations/0001_init.sql) — schema, RLS, seed pipeline
     stages, and the `move_deal_stage` function the pipeline board uses to atomically
     move a deal + log an activity
   - [`0002_audit_log.sql`](supabase/migrations/0002_audit_log.sql) — the `audit_log`
     table backing the System Log page (append-only: readable by any authenticated
     user, but no update/delete policy)
3. **Set environment variables**: copy `.env.local.example` to `.env.local` and fill in
   your project's URL and anon key (Project Settings → API in the Supabase dashboard):

   ```bash
   cp .env.local.example .env.local
   ```

4. **Invite your team**: there's no self-signup. Add teammates from the Supabase
   dashboard under Authentication → Users (invite by email, or create with a password
   directly).
5. **Run the app**:

   ```bash
   npm install
   npm run dev
   ```

   Visit http://localhost:3000 — you'll land on `/login`.

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment
   variables in the Vercel project settings.
4. Deploy, then verify the production build against your Supabase project.

## Project structure

- `supabase/migrations/0001_init.sql` — schema, RLS policies, seed data, and the
  `move_deal_stage` Postgres function
- `supabase/migrations/0002_audit_log.sql` — the `audit_log` table
- `src/lib/supabase/` — browser/server Supabase clients + session-refresh middleware
- `src/lib/audit-log.ts` — `logAudit()`, called from every mutating server action;
  pulls IP + geolocation from Vercel's edge headers (`x-vercel-ip-*`), null in local dev
- `src/proxy.ts` — route protection (redirects unauthenticated users to `/login`)
- `src/app/login/` — auth (also logs `login`/`logout` events)
- `src/app/(dashboard)/clients/` — clients list + detail (contacts CRUD, deals list)
- `src/app/(dashboard)/pipeline/` — kanban board (`@dnd-kit/core`)
- `src/app/(dashboard)/deals/[id]/` — deal detail, activity log, tasks
- `src/app/(dashboard)/tasks/` — cross-deal open tasks view
- `src/app/(dashboard)/system-log/` — audit trail view

## Phase 2 (not built yet — per the build plan, wait until Phase 1 is in daily use)

Dashboard aggregates, CSV import/export, global search.
