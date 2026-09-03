insert into changelog_entries (title, description, category, released_on) values
  (
    'Fixed Add Client modal positioning',
    'The Add Client modal was rendering pinned to the top-left, stretched full height, instead of centered on screen. Now displays as a proper centered card with a dimmed backdrop.',
    'fix',
    current_date
  );
