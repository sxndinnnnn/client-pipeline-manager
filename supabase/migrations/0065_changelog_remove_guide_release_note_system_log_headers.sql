insert into changelog_entries (title, description, category, released_on) values
  (
    'Removed page headers from Guide, Release Note, and System Log',
    'Same cleanup as Dashboard, Clients, Pipeline, and Tasks earlier - the nav/footer already names the current page, so the redundant on-page title is gone.',
    'improvement',
    current_date
  );
