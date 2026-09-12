insert into changelog_entries (title, description, category, released_on) values
  (
    'Configurable pipeline stage status',
    'Each pipeline stage now has a Status Type (Pending, In Progress, Won, or Lost), set from Settings > Pipeline Stages > Edit Stage. This drives whether a deal moved into that stage counts as won or lost, so it no longer depends on the stage being named exactly "Won" or "Lost" - and only won deals feed the Gain/Loss report.',
    'feature',
    current_date
  );
