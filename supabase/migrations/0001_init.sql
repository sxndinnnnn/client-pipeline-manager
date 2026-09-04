-- Client Pipeline Manager - initial schema
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

-- Row-Level Security: single internal team, any authenticated user has full access
alter table clients enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table pipeline_stages enable row level security;

create policy "authenticated full access" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on deals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on activities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on pipeline_stages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed default pipeline stages
insert into pipeline_stages (name, sort_order) values
  ('Lead', 0),
  ('Contacted', 1),
  ('Qualified', 2),
  ('Proposal', 3),
  ('Negotiation', 4),
  ('Won', 5),
  ('Lost', 6);

-- Atomic stage-move: updates the deal's stage (and status/closed_at when it
-- lands in Won/Lost) and logs an activity entry in a single transaction.
create or replace function move_deal_stage(p_deal_id uuid, p_stage_id uuid, p_actor_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_stage_name text;
  v_status text := 'OPEN';
  v_closed_at timestamptz := null;
begin
  select name into v_stage_name from pipeline_stages where id = p_stage_id;

  if v_stage_name is null then
    raise exception 'Unknown pipeline stage: %', p_stage_id;
  end if;

  if v_stage_name = 'Won' then
    v_status := 'WON';
    v_closed_at := now();
  elsif v_stage_name = 'Lost' then
    v_status := 'LOST';
    v_closed_at := now();
  end if;

  update deals
  set stage_id = p_stage_id,
      status = v_status,
      closed_at = v_closed_at,
      updated_at = now()
  where id = p_deal_id;

  if not found then
    raise exception 'Unknown deal: %', p_deal_id;
  end if;

  insert into activities (deal_id, author_id, type, content)
  values (p_deal_id, p_actor_id, 'note', 'Deal moved to stage: ' || v_stage_name);
end;
$$;
