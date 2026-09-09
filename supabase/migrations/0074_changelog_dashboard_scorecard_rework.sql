insert into changelog_entries (title, description, category, released_on) values
  (
    'Reworked the Dashboard scorecards',
    'Fixed the Pipeline By Stage chart clipping its "LKR" axis labels at larger values. Split Open Deals into Open Deals, Open Deals With Value, and Open Deals Without Value. Reordered the Open row to deal counts, then Open Pipeline Value, then Avg Open Deal Size, and reordered the Won and Lost rows to deals, rate, pipeline value, then avg deal size.',
    'improvement',
    current_date
  );
