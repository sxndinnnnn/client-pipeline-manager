insert into changelog_entries (title, description, category, released_on) values
  (
    'Reworked the deal detail modal',
    'The deal modal (opened from the Deals table) is now much larger, with Activity and Tasks as tabs instead of side-by-side columns. Edit and Delete moved inside the modal itself - the table''s Action column is back to a single View icon. Also removed the redundant "Client · industry" line from the client header.',
    'improvement',
    current_date
  );
