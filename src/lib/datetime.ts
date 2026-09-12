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
