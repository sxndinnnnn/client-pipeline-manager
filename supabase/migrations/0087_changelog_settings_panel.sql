insert into changelog_entries (title, description, category, released_on) values
  (
    'Added a Settings panel with master data management',
    'A new Settings area manages Plans (name, GPS/TMS/DVR/HES/FMS platforms, USD/LKR pricing, and a validity date range), Industries (drives the Client form dropdown), Pipeline Stages (add/rename/reorder/delete), and Users (invite/remove real logins, via the account menu). Deals now have a Plan field that autofills the deal value in LKR when selected.',
    'feature',
    current_date
  );
