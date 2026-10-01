-- The Release Note page was removed from the app, so changelog_entries is no
-- longer read or written. This permanently deletes the release history. To keep
-- a copy first, run this BEFORE the drop:
--   create table changelog_entries_backup as table changelog_entries;

drop table if exists changelog_entries;
