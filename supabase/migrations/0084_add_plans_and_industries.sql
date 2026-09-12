-- Master data: Plans (assigned to deals) and Industries (assigned to clients).

create table plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  platforms text[] not null default '{}'
    check (platforms <@ array['GPS','TMS','DVR','HES','FMS']),
  amount_usd numeric(12,2),
  amount_lkr numeric(12,2),
  valid_from date,
  valid_to date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table industries (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  created_at timestamptz default now()
);

alter table plans enable row level security;
alter table industries enable row level security;

create policy "authenticated full access" on plans
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on industries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed the industries master list from whatever free-text values clients
-- already have on file, so nothing existing gets lost when the Client form
-- switches from a free-text field to this managed dropdown.
insert into industries (name)
select distinct trim(industry)
from clients
where industry is not null and trim(industry) <> ''
on conflict (name) do nothing;
