insert into changelog_entries (title, description, category, released_on) values
  (
    'Release Note entries are now visually separated',
    'Removed the subtitle under the Release Note heading and added a divider line between entries sharing the same date, so it is easier to tell where one release ends and the next begins. Also replaced every em dash in the app (including older release notes) with a plain hyphen.',
    'improvement',
    current_date
  );
