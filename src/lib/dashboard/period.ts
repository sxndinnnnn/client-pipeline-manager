// Sri Lanka has no DST, so a fixed +05:30 offset gives correct local calendar
// boundaries (month/quarter/year starts) regardless of where the server runs.
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type DateRange = { start: Date; end: Date };

/** Start of the Colombo calendar month `monthOffset` months from the month containing `date`. */
function colomboMonthStart(date: Date, monthOffset = 0): Date {
  const local = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + monthOffset, 1) - COLOMBO_OFFSET_MS
  );
}

export function inRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

/** "2026-10" in Colombo time. */
export function monthKey(date: Date): string {
  const local = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function colomboYear(date: Date): number {
  return new Date(date.getTime() + COLOMBO_OFFSET_MS).getUTCFullYear();
}

/** The last `count` Colombo calendar months ending with the current one, oldest first. */
export function trailingMonths(now: Date, count: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = colomboMonthStart(now, -i);
    const local = new Date(start.getTime() + COLOMBO_OFFSET_MS);
    months.push({
      key: monthKey(start),
      label: `${MONTH_NAMES[local.getUTCMonth()]} ${String(local.getUTCFullYear()).slice(2)}`,
    });
  }
  return months;
}

/** Jan..Dec of the Colombo year containing `now`. */
export function monthsOfYear(now: Date): { key: string; label: string }[] {
  const year = colomboYear(now);
  return MONTH_NAMES.map((label, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label,
  }));
}
