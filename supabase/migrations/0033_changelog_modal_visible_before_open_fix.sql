insert into changelog_entries (title, description, category, released_on) values
  (
    'Fixed modals appearing on screen before being opened',
    'A regression from the last modal-centering fix made every modal (Add Client, Add Contact, Add Deal, edit contact, view/edit deal) render visible immediately, before clicking anything. Fixed.',
    'fix',
    current_date
  );
