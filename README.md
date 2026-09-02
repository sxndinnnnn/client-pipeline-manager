# Client Pipeline Manager

Internal sales/client pipeline tracker for a 2-3 person team. Next.js 14+ (App Router) +
TypeScript + Tailwind, backed by Supabase (Postgres, Auth, RLS). See
[pipeline-manager-build-plan.md](pipeline-manager-build-plan.md) for the full spec.

## Status

Phase 1 (MVP) is built: login, clients + contacts, pipeline board with drag-and-drop,
deal detail with activity log + tasks, and the standalone tasks view. It is **not yet
connected to a real Supabase project** — see setup below.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migration**: open the SQL Editor in your Supabase dashboard and run the
   contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates the schema, enables RLS, seeds the default pipeline stages, and adds the
   `move_deal_stage` function the pipeline board uses to atomically move a deal + log an
   activity.
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
- `src/lib/supabase/` — browser/server Supabase clients + session-refresh middleware
- `src/proxy.ts` — route protection (redirects unauthenticated users to `/login`)
- `src/app/login/` — auth
- `src/app/(dashboard)/clients/` — clients list + detail (contacts CRUD, deals list)
- `src/app/(dashboard)/pipeline/` — kanban board (`@dnd-kit/core`)
- `src/app/(dashboard)/deals/[id]/` — deal detail, activity log, tasks
- `src/app/(dashboard)/tasks/` — cross-deal open tasks view

## Phase 2 (not built yet — per the build plan, wait until Phase 1 is in daily use)

Dashboard aggregates, CSV import/export, global search.
