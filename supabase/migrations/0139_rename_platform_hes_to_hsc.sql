-- Rename the HES platform to HSC. The platforms column has a check constraint listing
-- the allowed codes, so: drop it, rewrite existing rows, then add it back with HSC.
-- Run this BEFORE (or right after) deploying: until it has run, saving a plan with HSC fails.

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'plans'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%platforms%'
  loop
    execute format('alter table plans drop constraint %I', c.conname);
  end loop;
end $$;

update plans set platforms = array_replace(platforms, 'HES', 'HSC') where 'HES' = any(platforms);

alter table plans
  add constraint plans_platforms_check
  check (platforms <@ array['GPS','TMS','DVR','HSC','FMS']);
