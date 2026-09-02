insert into changelog_entries (title, description, category, released_on) values
  (
    'Security audit fixes',
    'Fixed two issues found in a security audit: the pipeline stage-move function could be called directly to attribute an activity note to the wrong user, and the post-login redirect could be pointed at an external site via a crafted link. Both are closed now.',
    'fix',
    current_date
  );
