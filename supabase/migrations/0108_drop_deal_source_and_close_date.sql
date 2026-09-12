-- Source and Expected Close Date are no longer collected or shown anywhere
-- in the app (removed from Add Deal, both edit-deal forms, and their
-- read-only displays), so drop the now-dead columns.
alter table deals drop column source;
alter table deals drop column expected_close_date;
