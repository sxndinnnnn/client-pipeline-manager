insert into changelog_entries (title, description, category, released_on) values
  (
    'Plans deactivate automatically after expiry',
    'A plan past its "Valid To" date is now marked Expired in Settings > Plans and no longer offered when creating or reassigning a deal''s plan. Deals already using an expired plan keep it.',
    'improvement',
    current_date
  );
