// Sri Lanka has no DST, so a fixed +05:30 offset gives correct local calendar
// boundaries (month and year) regardless of where the server runs.
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" in Colombo time. */
export function monthKey(date: Date): string {
  const local = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function colomboYear(date: Date): number {
  return new Date(date.getTime() + COLOMBO_OFFSET_MS).getUTCFullYear();
}

/** Jan..Dec of the Colombo year containing `now`. */
export function monthsOfYear(now: Date): { key: string; label: string }[] {
  const year = colomboYear(now);
  return MONTH_NAMES.map((label, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label,
  }));
}
