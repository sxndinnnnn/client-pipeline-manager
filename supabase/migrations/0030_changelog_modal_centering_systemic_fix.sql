insert into changelog_entries (title, description, category, released_on) values
  (
    'Fixed all modals rendering off-center',
    'Every modal in the app (Add Client, Add Contact, Add Deal, edit contact, view/edit deal) could render pinned off to one side on some pages instead of centered. Fixed for good with a more robust centering approach.',
    'fix',
    current_date
  );
