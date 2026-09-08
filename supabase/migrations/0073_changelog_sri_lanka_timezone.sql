insert into changelog_entries (title, description, category, released_on) values
  (
    'Fixed timestamps showing in UTC instead of Sri Lanka time',
    'The System Log, deal activity, and client activity timestamps now always display in Sri Lanka time (GMT+5:30), including for past records - only how times are displayed changed, not how they are stored.',
    'fix',
    current_date
  );
