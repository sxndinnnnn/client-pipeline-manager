export const LOSS_REASONS = [
  "Price too high",
  "Chose a competitor",
  "No budget",
  "No response / went cold",
  "Missing features",
  "Timing / not ready",
  "Other",
] as const;

/** Stored as the preset text, or "Other: <note>" when a note was given. */
export function formatLostReason(reason: string, note: string): string {
  const trimmedNote = note.trim();
  return reason === "Other" && trimmedNote ? `Other: ${trimmedNote}` : reason;
}

/** Groups "Other: <note>" under plain "Other" for reporting. */
export function lostReasonCategory(reason: string | null): string {
  if (!reason) return "No reason given";
  return reason.startsWith("Other:") ? "Other" : reason;
}
