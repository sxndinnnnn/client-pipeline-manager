insert into changelog_entries (title, description, category, released_on) values
  (
    'Paginated the System Log and bounded its size',
    'System Log now shows 100 entries per page instead of a flat list of 200. Behind the scenes, a daily job automatically purges anything beyond the most recent 1000 entries so the log can''t grow unbounded.',
    'improvement',
    current_date
  );
