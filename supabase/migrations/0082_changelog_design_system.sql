insert into changelog_entries (title, description, category, released_on) values
  (
    'Rebuilt the visual design system',
    'Replaced scattered gray/blue/green/amber/red Tailwind classes with a proper set of design tokens built from our brand palette (teal/navy primary, matching the Logistix360 logo for the first time), fixed a bug where the loaded Geist font was silently overridden by Arial, consolidated over a dozen duplicated icon components into one shared icon set, added a three-tier shadow and hover system across cards and rows, and added the Logistix360 logo to the dashboard header.',
    'improvement',
    current_date
  );
