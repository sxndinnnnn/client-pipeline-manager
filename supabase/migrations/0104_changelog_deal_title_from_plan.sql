insert into changelog_entries (title, description, category, released_on) values
  (
    'Deal names now come from the plan',
    'Creating or editing a deal no longer has a separate Deal Title field - a plan is now required, and the deal is named after it automatically. This shows up everywhere a deal''s name is displayed, including the Pipeline board. A deal already using a plan keeps working as before; one with no plan needs a plan picked the next time it''s edited.',
    'improvement',
    current_date
  );
