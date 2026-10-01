insert into changelog_entries (title, description, category, released_on) values
  (
    'Removed the System Log page',
    'The System Log page and its footer link were removed. Actions are still recorded in the background audit table.',
    'improvement',
    current_date
  );
