-- System audit log: records every mutating action a user takes, with the
-- request's IP address and geolocation (populated from Vercel's edge
-- geolocation headers in production; null in local dev).
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  user_email text,
  action text not null,
  description text not null,
  entity_type text,
  entity_id uuid,
  ip_address text,
  city text,
  region text,
  country text,
  user_agent text,
  created_at timestamptz default now()
);

create index on audit_log (created_at desc);
create index on audit_log (user_id);

alter table audit_log enable row level security;

-- Any authenticated teammate can read the log (matches the rest of the app's
-- "single internal team, full access" model), but there is deliberately no
-- update/delete policy — entries are append-only once written.
create policy "authenticated read" on audit_log
  for select using (auth.role() = 'authenticated');

create policy "authenticated insert" on audit_log
  for insert with check (auth.role() = 'authenticated');
