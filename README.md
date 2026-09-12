# Client Pipeline Manager

Internal sales/client pipeline tracker for a 2-3 person team. Next.js 16 (App Router) +
TypeScript + Tailwind CSS v4, backed by Supabase (Postgres, Auth, Storage, RLS). See
[PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) for the full project context and history.

## Status

Original Phase 1 (MVP) is built and deployed, plus a long list of follow-up features:
clients + contacts, pipeline board with drag-and-drop, deal detail with activity log,
Settings (plans, industries, pipeline stages, user management), Reports (extensible
report generator, starting with Gain/Loss), Release Note, and a System Log audit trail
(every mutating action, with the actor, IP address, and geolocation).

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
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` - server-only, used exclusively by Settings > Users for
     Supabase Auth admin operations (inviting/removing users). Keep this out of any
     client-visible code path.

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
2. Import it into [Vercel](https://vercel.com/new).
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` as environment variables in the Vercel project settings.
4. Deploy, then verify the production build against your Supabase project.

## Project structure

- `supabase/migrations/` - schema, RLS policies, and data migrations, run in order
- `src/lib/supabase/` - server Supabase client + admin (service-role) client +
  session-refresh middleware
- `src/lib/audit-log.ts` - `logAudit()`, called from every mutating server action;
  pulls IP + geolocation from Vercel's edge headers (`x-vercel-ip-*`), null in local dev
- `src/proxy.ts` - route protection (redirects unauthenticated users to `/login`)
- `src/app/login/` - auth (also logs `login`/`logout` events)
- `src/app/(dashboard)/dashboard/` - overview stats
- `src/app/(dashboard)/clients/` - clients list + detail (contacts CRUD, deals list)
- `src/app/(dashboard)/pipeline/` - kanban board (`@dnd-kit/core`)
- `src/app/(dashboard)/deals/[id]/` - deal detail, activity log
- `src/app/(dashboard)/reports/` - report generator (Gain/Loss, extensible)
- `src/app/(dashboard)/settings/` - plans, industries, pipeline stages, user management
- `src/app/(dashboard)/system-log/` - audit trail view
- `src/app/(dashboard)/release-note/` - in-app changelog
