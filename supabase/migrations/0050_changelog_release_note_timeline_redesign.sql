insert into changelog_entries (title, description, category, released_on) values
  (
    'Redesigned Release Note as a timeline',
    'Release Note now shows a vertical timeline (inspired by Linear''s changelog) with a dot and date per day, bold entry titles with a category emoji (✨ feature, 🛠️ improvement, 🐛 fix), and a color-coded tag. Every future release will follow this same format.',
    'improvement',
    current_date
  );
