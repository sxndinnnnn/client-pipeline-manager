insert into changelog_entries (title, description, category, released_on) values
  (
    'Removed the Guide',
    'The Guide page and its footer nav link have been removed. There was no database table behind it - it was static in-app documentation, so no schema changes are needed.',
    'improvement',
    current_date
  );
