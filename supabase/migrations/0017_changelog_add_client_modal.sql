insert into changelog_entries (title, description, category, released_on) values
  (
    'Add Client is now a real modal',
    'Add Client now opens as a proper modal that closes when you click outside it, press Escape, or hit the X button, instead of staying open until you clicked the button again. Also removed the Tags field from that form (still editable afterward), and relabeled a few buttons: "Log Out", "Add Client", "Create Client".',
    'improvement',
    current_date
  );
