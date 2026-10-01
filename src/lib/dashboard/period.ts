// Sri Lanka has no DST, so a fixed +05:30 offset gives correct local calendar
// boundaries (month/quarter/year starts) regardless of where the server runs.
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type PeriodKey = "month" | "quarter" | "year" | "all";

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

export type DateRange = { start: Date; end: Date };

export type ResolvedPeriod = {
  key: PeriodKey;
  label: string;
  current: DateRange;
  /** null for "all", which has nothing to compare against. */
  previous: DateRange | null;
  previousLabel: string | null;
};

/** Start of the Colombo calendar month `monthOffset` months from the month containing `date`. */
function colomboMonthStart(date: Date, monthOffset = 0): Date {
  const local = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + monthOffset, 1) - COLOMBO_OFFSET_MS
  );
}

export function parsePeriod(raw: string | undefined): PeriodKey {
  return PERIOD_OPTIONS.some((p) => p.key === raw) ? (raw as PeriodKey) : "month";
}

export function resolvePeriod(key: PeriodKey, now: Date): ResolvedPeriod {
  if (key === "all") {
    return {
      key,
      label: "All Time",
      current: { start: new Date(0), end: new Date(8.64e15) },
      previous: null,
      previousLabel: null,
    };
  }

  const local = new Date(now.getTime() + COLOMBO_OFFSET_MS);
  const monthsInPeriod = key === "month" ? 1 : key === "quarter" ? 3 : 12;
  const monthIndex = local.getUTCMonth();
  const startMonthOffset =
    key === "month" ? 0 : key === "quarter" ? -(monthIndex % 3) : -monthIndex;

  const start = colomboMonthStart(now, startMonthOffset);
  const end = colomboMonthStart(now, startMonthOffset + monthsInPeriod);
  const previous = { start: colomboMonthStart(now, startMonthOffset - monthsInPeriod), end: start };

  const label =
    key === "month" ? "this month" : key === "quarter" ? "this quarter" : "this year";
  const previousLabel =
    key === "month" ? "last month" : key === "quarter" ? "last quarter" : "last year";

  return { key, label, current: { start, end }, previous, previousLabel };
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

/** Percentage change, or null when there is no meaningful baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
