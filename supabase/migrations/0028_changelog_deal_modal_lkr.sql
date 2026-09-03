insert into changelog_entries (title, description, category, released_on) values
  (
    'Deal values now in LKR',
    'Deal values across the app (pipeline board, deal pages, client Deals table) now display as LKR instead of $.',
    'improvement',
    current_date
  ),
  (
    'View/Edit/Delete a deal from the client page',
    'The Deals table''s Action column now has View, Edit, and Delete icons. View and Edit open the deal''s full detail — value, source, dates, activity log, and tasks — in a modal, without leaving the client page.',
    'feature',
    current_date
  );
