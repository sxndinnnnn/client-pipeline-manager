-- The System Log page and all audit logging were removed from the app, so the
-- audit_log table is no longer read or written. This permanently deletes its
-- history. If you want to keep a copy first, run this BEFORE the drop:
--   create table audit_log_backup as table audit_log;
-- (and only drop the backup yourself once you are sure you no longer need it).

drop table if exists audit_log;
