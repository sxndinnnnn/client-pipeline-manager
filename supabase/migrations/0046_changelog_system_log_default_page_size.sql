insert into changelog_entries (title, description, category, released_on) values
  (
    'Changed System Log default page size to 25',
    'System Log now shows 25 entries per page by default instead of 100 (still adjustable via Rows Per Page).',
    'improvement',
    current_date
  );
