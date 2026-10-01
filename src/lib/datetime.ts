// Timestamps are stored in UTC; the team works out of Sri Lanka, so every
// displayed date/time is rendered in that timezone regardless of where the
// page happens to render (server or browser).
const DISPLAY_TIME_ZONE = "Asia/Colombo";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** ISO timestamp -> "YYYY-MM-DDTHH:mm" in Colombo time, for <input type="datetime-local">. */
export function toColomboInputValue(iso: string): string {
  return new Date(new Date(iso).getTime() + COLOMBO_OFFSET_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" read as Colombo time -> ISO timestamp, or null if it is not valid. */
export function parseColomboInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
