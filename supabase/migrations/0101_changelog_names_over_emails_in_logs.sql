insert into changelog_entries (title, description, category, released_on) values
  (
    'Names instead of emails in System Log and Created/Updated By',
    'System Log and the client detail page''s Created By / Updated By now show a teammate''s profile name (Settings > Users) instead of their email, falling back to the email if no name is set yet. This applies to existing history too, since the name is looked up live rather than stored per record. Login/logout/removed-user log entries going forward also use the name.',
    'improvement',
    current_date
  );
