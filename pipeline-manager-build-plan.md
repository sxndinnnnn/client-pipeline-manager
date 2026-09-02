# Client Pipeline Manager — Build Plan

Give this whole document to Claude Code as the starting brief. It's a full spec for a
custom sales/client pipeline tracker for a 2-3 person team.

## 1. Project Overview

Build a lightweight internal tool to track clients, contacts, and deals moving through
a sales pipeline (kanban-style board), with activity logging and follow-up tasks.
Single internal team, no external/customer-facing surface.

## 2. Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase — Postgres database, built-in Auth, auto-generated REST API,
  Row-Level Security for access control
- **Custom backend logic**: Next.js API routes (or Supabase Edge Functions) *only* for
  operations that aren't plain CRUD — e.g. moving a deal to a new stage while logging
  an activity in one transaction, or dashboard aggregate queries
- **Hosting**: Vercel (frontend), Supabase (database/auth)
- **Client library**: `@supabase/supabase-js` and `@supabase/ssr` for server/client data access

Do not introduce Prisma or a separate ORM — query Supabase directly via its client library
so we get the auto-generated API and RLS for free.

## 3. Data Model

Create this schema via Supabase SQL migration (`supabase/migrations/0001_init.sql`):

```sql
create extension if not exists "uuid-ossp";

create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text,
  notes text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table contacts (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table pipeline_stages (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  sort_order int unique not null
);

create table deals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  client_id uuid references clients(id) on delete cascade,
  stage_id uuid references pipeline_stages(id),
  owner_id uuid references auth.users(id),
  value numeric(12,2),
  status text not null default 'OPEN' check (status in ('OPEN','WON','LOST')),
  source text,
  expected_close_date date,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table activities (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade,
  author_id uuid references auth.users(id),
  type text not null check (type in ('call','email','meeting','note')),
  content text not null,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade,
  assignee_id uuid references auth.users(id),
  title text not null,
  due_date date,
  status text not null default 'PENDING' check (status in ('PENDING','DONE')),
  created_at timestamptz default now()
);

create index on contacts (client_id);
create index on deals (client_id);
create index on deals (stage_id);
create index on activities (deal_id);
create index on tasks (deal_id);
```

**Row-Level Security**: enable RLS on every table. Since this is one internal team with no
per-client customer access, the policy is simple — any authenticated user can read/write
everything:

```sql
alter table clients enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table pipeline_stages enable row level security;

create policy "authenticated full access" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- repeat the same policy for contacts, deals, activities, tasks, pipeline_stages
```

**Seed data**: insert default pipeline stages — Lead, Contacted, Qualified, Proposal,
Negotiation, Won, Lost (sort_order 0-6).

## 4. Auth

Use Supabase Auth with email/password (magic link is fine too). No self-signup —
team members are invited manually via the Supabase dashboard. No roles/permissions
needed for v1; every authenticated user has full access.

## 5. Core Pages / Features (MVP — build in this order)

1. **Login page** — Supabase Auth email/password form
2. **Clients list** — table/cards of all clients, search by name, "Add client" form
3. **Client detail page** — client info, its contacts (add/edit/delete inline), list of
   its deals
4. **Pipeline board** (`/pipeline`) — kanban view, one column per stage, deal cards
   draggable between columns (use `@dnd-kit/core`); dropping a card updates `stage_id`
   and, if dropped in Won/Lost, also sets `status` + `closed_at`
5. **Deal detail page** — deal fields (editable), activity log (add a note/call/email/
   meeting entry, newest first), task list scoped to this deal
6. **Tasks view** (`/tasks`) — all open tasks across deals, sorted by due date, checkbox
   to mark done

## 6. Phase 2 (after MVP is in daily use — do not build until Phase 1 is confirmed working)

- Dashboard: total pipeline value by stage, win rate, deals closing this month
- CSV import for migrating existing spreadsheet data
- Global search across clients/deals
- Basic export (CSV) of deals

## 7. Build Order for Claude Code

Work through these steps sequentially, confirming each works before moving to the next:

1. Scaffold Next.js + TypeScript + Tailwind project
2. Set up Supabase project connection (`.env.local` with `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`), add the SQL migration above, run it, seed stages
3. Build Supabase auth: login page + session middleware protecting all routes except
   `/login`
4. Build Clients list + client detail page (CRUD against `clients` and `contacts` tables
   directly via `supabase-js`)
5. Build the pipeline board with drag-and-drop stage moves
6. Build deal detail page with activity log and tasks
7. Build the standalone tasks view
8. Pass through for empty states, loading states, and basic error handling everywhere
9. Deploy: push to GitHub, connect to Vercel, set env vars, verify production build

## 8. Explicit Non-Goals for v1

Do not build: role-based permissions, multi-tenant support, email/calendar integration,
mobile app, notifications, or any billing/payments. Keep the schema and UI exactly as
scoped above — resist adding fields or tables not listed here.

## 9. Acceptance Criteria

The build is done when a user can: log in, create a client with a contact, create a deal
for that client, drag it across pipeline stages, log an activity on it, add and complete
a task, and see it reflected correctly after a page refresh (i.e., state is persisted in
Supabase, not just local React state).
