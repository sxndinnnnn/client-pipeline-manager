insert into changelog_entries (title, description, category, released_on) values
  (
    'Fixed a deal/contact modal opening on its own',
    'The View/Edit modal for a deal or contact could appear open just from navigating to that tab, without clicking anything. It now only ever opens from an explicit click.',
    'fix',
    current_date
  );
