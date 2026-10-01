insert into changelog_entries (title, description, category, released_on) values
  (
    'Removed the System Log and audit logging',
    'The System Log page is gone and the app no longer records an audit trail of actions (IP address, location and user for each change).',
    'improvement',
    current_date
  );
