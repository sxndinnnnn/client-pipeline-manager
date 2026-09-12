insert into changelog_entries (title, description, category, released_on) values
  (
    'Activate/Deactivate clients, Clients list is now a table',
    'The client detail page has an Activate/Deactivate button next to Delete Client, and inactive clients show an Inactive badge next to their name. The Clients list is now a table with columns for industry, contacts, and deal counts by status (total, open, won, lost).',
    'feature',
    current_date
  );
