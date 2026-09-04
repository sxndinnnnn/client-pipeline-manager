-- Keep audit_log bounded: purge everything beyond the most recent 1000 rows,
-- run automatically on a schedule via pg_cron.

-- pg_cron ships with Supabase but isn't enabled by default on every project.
-- If the next statement errors with "extension pg_cron does not exist", enable
-- it once via Database > Extensions > pg_cron in the Supabase dashboard, then
-- re-run this migration.
create extension if not exists pg_cron with schema extensions;

create or replace function purge_old_audit_log()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from audit_log
  where id in (
    select id from audit_log
    order by created_at desc
    offset 1000
  );
end;
$$;

comment on function purge_old_audit_log() is
  'Deletes all but the 1000 most recent audit_log rows (by created_at). Scheduled via pg_cron - see the purge-audit-log-daily job.';

-- Re-running select cron.schedule with the same job name updates that job in
-- place rather than creating a duplicate, so this migration is safe to re-run.
select cron.schedule(
  'purge-audit-log-daily',
  '0 3 * * *', -- daily at 03:00 UTC
  $$ select purge_old_audit_log(); $$
);
