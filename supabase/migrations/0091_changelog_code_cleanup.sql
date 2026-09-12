insert into changelog_entries (title, description, category, released_on) values
  (
    'Code cleanup',
    'Removed dead code and unused dependencies (an unused Supabase browser client, an unused icon, and two unused packages), fixed a stale redirect left over from the Guide removal, and brought the project documentation up to date. No user-visible behavior changed.',
    'improvement',
    current_date
  );
