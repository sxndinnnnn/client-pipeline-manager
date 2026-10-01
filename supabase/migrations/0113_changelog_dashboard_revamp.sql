insert into changelog_entries (title, description, category, released_on) values
  (
    'Dashboard revamp with period-based KPIs',
    'The dashboard now has a Month / Quarter / Year / All time selector and compares each headline metric with the previous period. New KPIs: sales cycle length, weighted pipeline, target coverage, stale deals, conversion funnel, monthly won-vs-lost and created-vs-closed trends, revenue vs target, win rate by plan and industry, loss reasons, and team activity. Low-value tiles (open-deals-with-value donut, average open and lost deal size, lost rate) were removed.',
    'feature',
    current_date
  ),
  (
    'Lost reason, stage win probability and yearly targets',
    'Dropping a deal into a Lost stage now asks for a reason. Pipeline stages have a win probability (used for the weighted pipeline), and Settings has a new Targets tab for yearly sales targets.',
    'feature',
    current_date
  );
