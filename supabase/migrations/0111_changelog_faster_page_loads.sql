insert into changelog_entries (title, description, category, released_on) values
  (
    'Faster page loads',
    'The app now runs in the same region as the database and no longer makes redundant sign-in checks, so pages load noticeably quicker.',
    'improvement',
    current_date
  );
