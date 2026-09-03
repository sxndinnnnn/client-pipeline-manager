insert into changelog_entries (title, description, category, released_on) values
  (
    'Paginated the clients list',
    'The Clients page now loads 10 clients at a time (adjustable to 25/50/100 via Rows per page) with page numbers to move through the rest, instead of loading every client at once. Lighter on the database as the client list grows.',
    'improvement',
    current_date
  );
