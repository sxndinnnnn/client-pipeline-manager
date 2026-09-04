insert into changelog_entries (title, description, category, released_on) values
  (
    'Removed page headers; Dashboard is now the landing page',
    'Removed the redundant page-title headers on Dashboard, Clients, Pipeline, and Tasks (the nav bar already shows which page you''re on). Logging in, or visiting the app with no path, now lands on the Dashboard instead of Clients.',
    'improvement',
    current_date
  );
