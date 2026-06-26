/**
 * Date/number formatting for display. Local times from Open-Meteo arrive without
 * an offset (e.g. "2026-06-26T14:00"); we read the clock fields directly so the
 * viewer's own timezone never shifts the site-local hours.
 */
import type { MetricKey } from "@/lib/weather/types";

function hourOf(isoLocal: string): number {
  return Number(isoLocal.slice(11, 13));
}

/** "2026-06-26T14:00" → "2pm". */
export function formatHour(isoLocal: string): string {
  const h = hourOf(isoLocal);
  const period = h < 12 ? "a" : "p";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${period}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse a "YYYY-MM-DD" as a local calendar date (no timezone drift). */
function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-06-26" → "Thu". */
export function formatWeekday(date: string): string {
  return WEEKDAYS[parseDate(date).getDay()];
}

/** "2026-06-26" → "Jun 26". */
export function formatMonthDay(date: string): string {
  const d = parseDate(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const UNIT: Record<MetricKey, string> = {
  wind: " kn",
  wave: " ft",
  precip: "%",
  visibility: " mi",
};

export const METRIC_LABEL: Record<MetricKey, string> = {
  wind: "Wind",
  wave: "Waves",
  precip: "Rain",
  visibility: "Vis",
};

/** Format a metric value with its unit, or an em dash when unavailable. */
export function formatMetric(metric: MetricKey, value: number | null): string {
  if (value == null) return "—";
  return `${value}${UNIT[metric]}`;
}

/** "2026-06-26T07:02:11Z" + now → "2h ago" / "just now". */
export function formatRelativeAge(fetchedAtIso: string, now = Date.now()): string {
  const diffMs = now - new Date(fetchedAtIso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
