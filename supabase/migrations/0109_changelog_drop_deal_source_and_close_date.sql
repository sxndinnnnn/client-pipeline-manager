insert into changelog_entries (title, description, category, released_on) values
  (
    'Removed Source and Expected Close Date from deals',
    'These fields have been removed from the deal edit forms (client detail and standalone deal page) and their read-only summaries. The underlying columns have also been dropped.',
    'improvement',
    current_date
  );
