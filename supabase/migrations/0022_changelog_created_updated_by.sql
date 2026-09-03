insert into changelog_entries (title, description, category, released_on) values
  (
    'Added Created By / Updated By to clients',
    'The client detail header now shows who created and last updated the client, alongside the existing dates. Only populated going forward — clients created before this change won''t show a name.',
    'feature',
    current_date
  );
