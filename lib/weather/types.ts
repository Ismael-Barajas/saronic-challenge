/**
 * Domain types for the Gulfport Demo Weather Look-Ahead.
 *
 * These are shared across the pure scoring logic (`scoring.ts`), the API parsing
 * (`openMeteo.ts`), and the UI. They intentionally carry no Next/React dependency
 * so the scoring core stays portable.
 */

/** Traffic-light read applied to a metric, an hour, or a whole day. */
export type Verdict = "GO" | "CAUTION" | "NO_GO";

/** The four conditions Tara cares about. */
export type MetricKey = "wind" | "wave" | "precip" | "visibility";

/**
 * Raw, merged weather for a single hour at the site, already converted to the
 * units we display in. `null` means the upstream API did not provide that value
 * for this hour (e.g. the marine API returned no wave data).
 */
export interface HourPoint {
  /** ISO 8601 local time, e.g. "2026-06-26T14:00". */
  time: string;
  /** Wind speed at 10m, knots. */
  windKn: number | null;
  /** Significant wave height, feet. */
  waveFt: number | null;
  /** Precipitation total for the hour, millimetres. */
  precipMm: number | null;
  /** Probability of precipitation, percent (0–100). */
  precipProbability: number | null;
  /** Visibility, statute miles. */
  visibilityMi: number | null;
  /** WMO weather code (used to flag fog / thunderstorm). */
  weatherCode: number | null;
}

/** The verdict for one metric in one hour, with the value that produced it. */
export interface MetricVerdict {
  metric: MetricKey;
  verdict: Verdict;
  /** The evaluated value (in display units), or `null` when unavailable. */
  value: number | null;
  /** False when the metric had no data and was skipped rather than scored. */
  available: boolean;
}

/** An hour enriched with its per-metric and overall verdicts. */
export interface ScoredHour extends HourPoint {
  /** Per-metric verdicts, keyed by metric. */
  metrics: Record<MetricKey, MetricVerdict>;
  /** Worst of the available metric verdicts for this hour. */
  verdict: Verdict;
  /** Whether this hour falls inside the day's demo window. */
  inWindow: boolean;
}

/** Sunrise / sunset for a day, as ISO local time strings. */
export interface DaylightInfo {
  sunrise: string;
  sunset: string;
}

/** The single condition (and when) that drove a day's verdict. */
export interface LimitingFactor {
  metric: MetricKey;
  verdict: Verdict;
  /** The value at the limiting hour (display units), or `null`. */
  value: number | null;
  /** ISO local time of the worst in-window hour. */
  time: string;
  /** Human-readable summary, e.g. "wind 22 kn at 2pm". */
  label: string;
}

/** The headline (most adverse) reading for one metric over a day's window. */
export interface MetricSummary {
  metric: MetricKey;
  /** Value in display units at the most adverse in-window hour, or `null`. */
  value: number | null;
  verdict: Verdict;
  available: boolean;
}

/** A single day's forecast plus its computed go/no-go read. */
export interface DayForecast {
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  /** Worst in-window hour — the day's conservative read. */
  verdict: Verdict;
  /** What/when limited the day; `null` on a clean GO with nothing notable. */
  limitingFactor: LimitingFactor | null;
  /** All hours for the day, each flagged with `inWindow`. */
  hours: ScoredHour[];
  /** Sunrise/sunset used to derive the demo window; `null` if unavailable. */
  daylight: DaylightInfo | null;
  /** Days far out (8–10) where forecast reliability degrades. */
  lowerConfidence: boolean;
  /** False when the marine API returned no wave data for this day. */
  waveDataAvailable: boolean;
}

/** The full payload the UI renders: a site and its 10-day look-ahead. */
export interface Forecast {
  /** Site label, e.g. "Gulf Test Range — Gulfport, MS". */
  site: string;
  latitude: number;
  longitude: number;
  /** IANA timezone of the times, resolved from the site coordinates. */
  timezone: string;
  /** Short timezone label from the upstream API (e.g. "GMT-5"). */
  timezoneAbbreviation: string;
  /** When the upstream data was fetched (ISO 8601). */
  fetchedAt: string;
  days: DayForecast[];
}
