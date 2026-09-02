-- In-app release notes: what's shipped in the tool itself, shown on /changelog.
create table changelog_entries (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text not null default 'feature' check (category in ('feature', 'fix', 'improvement')),
  released_on date not null default current_date,
  created_at timestamptz default now()
);

create index on changelog_entries (released_on desc);

alter table changelog_entries enable row level security;

create policy "authenticated full access" on changelog_entries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into changelog_entries (title, description, category, released_on) values
  (
    'Phase 1 launch',
    'Client and contact management, a drag-and-drop pipeline board, deal detail pages with an activity log and tasks, and a cross-deal tasks view.',
    'feature',
    current_date
  ),
  (
    'System audit log',
    'Every mutating action — logins, client/contact/deal changes, stage moves, tasks — is now recorded with the acting user, IP address, and geolocation. View it on the System Log page.',
    'feature',
    current_date
  ),
  (
    'Fixed unreadable form text',
    'Form fields rendered white-on-white for anyone with their OS in dark mode. Text is now always dark and legible regardless of system theme.',
    'fix',
    current_date
  ),
  (
    'Changelog',
    'Added this page so the team can see what''s shipped in the tool over time.',
    'feature',
    current_date
  );
