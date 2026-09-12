-- DESTRUCTIVE: permanently removes the Tasks feature and all existing task
-- data. Requested because the team is no longer using Tasks. There is no
-- undo once this runs - back up the `tasks` table first if you want to keep
-- a copy (e.g. `create table tasks_backup as table tasks;` before running
-- this file).
drop table if exists tasks;
