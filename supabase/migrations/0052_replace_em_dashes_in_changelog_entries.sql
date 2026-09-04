-- Data fix: existing changelog_entries rows contain em dashes ("—") in their
-- title/description, inserted by earlier migrations. The app's source and all
-- future entries now use a plain hyphen instead, so bring existing rows in
-- line. Safe to re-run (no-op once no em dashes remain).
update changelog_entries
set title = replace(title, '—', '-'),
    description = replace(description, '—', '-')
where title like '%—%' or description like '%—%';
