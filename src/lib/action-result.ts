/** What a form-driven server action returns: an error message to display, or nothing. */
export type ActionResult = { error?: string };

// Production builds replace any error thrown from a server action with a generic masked
// message (React error 441), so the real reason never reaches the form. Actions that a
// form calls therefore catch their own errors and return the text instead.
export async function runAction(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return {};
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : "Something went wrong";
  // The allowed platform codes are enforced by a database check; HSC replaced HES in 0139.
  if (message.includes("plans_platforms_check")) {
    return "The database doesn't accept this platform yet. Run migration 0139_rename_platform_hes_to_hsc.sql in the Supabase SQL Editor.";
  }
  if (/duplicate key value/i.test(message)) {
    return "That name is already in use.";
  }
  return message;
}
