-- Name and job position per Supabase Auth user, shown in Settings > Users.
-- Auth itself only tracks email - these are app-level fields with no home
-- in auth.users, so they get their own table keyed 1:1 on the user's id.

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  position text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "authenticated full access" on user_profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
