insert into changelog_entries (title, description, category, released_on) values
  (
    'Added delete for clients, tasks, and activity',
    'Delete Client is now available on the client detail page (with a confirmation prompt, since it also removes all of that client''s contacts, deals, activity, and tasks). Individual tasks and activity log entries can now be deleted with a trash icon, wherever they''re shown: the deal modal, the standalone deal page, and the Tasks page.',
    'feature',
    current_date
  );
