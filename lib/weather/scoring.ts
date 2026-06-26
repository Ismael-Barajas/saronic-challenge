/**
 * Go/no-go scoring for the Gulfport demo look-ahead.
 *
 * Pure and framework-agnostic — no Next/React imports — so it can be reused by a
 * future React Native app. This is the heart of the product: it encodes *Tara's
 * own thresholds* and never invents judgement beyond them.
 */

import type {
  DayForecast,
  DaylightInfo,
  HourPoint,
  LimitingFactor,
  MetricKey,
  MetricVerdict,
  ScoredHour,
  Verdict,
} from "./types";

// ---------------------------------------------------------------------------
// Thresholds — Tara's stated limits, as named constants (the single source of
// truth; the UI must not re-implement these).
// ---------------------------------------------------------------------------

/** Wind (knots): <15 GO · 15–20 CAUTION · >20 NO-GO. */
export const WIND_CAUTION_KN = 15;
export const WIND_NOGO_KN = 20;

/** Wave height (feet): <2 GO · 2–4 CAUTION · >4 NO-GO. */
export const WAVE_CAUTION_FT = 2;
export const WAVE_NOGO_FT = 4;

/** Visibility (statute miles): >5 GO · 2–5 CAUTION · <2 NO-GO. */
export const VIS_CAUTION_MI = 5;
export const VIS_NOGO_MI = 2;

/** Precipitation: optics-strict. */
export const PRECIP_TRACE_MM = 0.1;
export const PRECIP_NOGO_MM = 0.5;
export const PRECIP_PROB_CAUTION = 30;
export const PRECIP_PROB_NOGO = 60;

/** Demo window: business hours, clamped further by daylight when known. */
export const BUSINESS_START_HOUR = 8;
export const BUSINESS_END_HOUR = 17;

// ---------------------------------------------------------------------------
// Per-metric scoring
// ---------------------------------------------------------------------------

const VERDICT_SEVERITY: Record<Verdict, number> = {
  GO: 0,
  CAUTION: 1,
  NO_GO: 2,
};

function unavailable(metric: MetricKey): MetricVerdict {
  return { metric, verdict: "GO", value: null, available: false };
}

export function scoreWind(windKn: number | null): MetricVerdict {
  if (windKn == null) return unavailable("wind");
  const verdict: Verdict =
    windKn > WIND_NOGO_KN ? "NO_GO" : windKn >= WIND_CAUTION_KN ? "CAUTION" : "GO";
  return { metric: "wind", verdict, value: windKn, available: true };
}

export function scoreWave(waveFt: number | null): MetricVerdict {
  if (waveFt == null) return unavailable("wave");
  const verdict: Verdict =
    waveFt > WAVE_NOGO_FT ? "NO_GO" : waveFt >= WAVE_CAUTION_FT ? "CAUTION" : "GO";
  return { metric: "wave", verdict, value: waveFt, available: true };
}

export function scoreVisibility(visibilityMi: number | null): MetricVerdict {
  if (visibilityMi == null) return unavailable("visibility");
  const verdict: Verdict =
    visibilityMi < VIS_NOGO_MI
      ? "NO_GO"
      : visibilityMi <= VIS_CAUTION_MI
        ? "CAUTION"
        : "GO";
  return { metric: "visibility", verdict, value: visibilityMi, available: true };
}

export function scorePrecip(
  precipMm: number | null,
  precipProbability: number | null,
): MetricVerdict {
  if (precipMm == null && precipProbability == null) return unavailable("precip");
  const mm = precipMm ?? 0;
  const prob = precipProbability ?? 0;
  const verdict: Verdict =
    mm >= PRECIP_NOGO_MM || prob >= PRECIP_PROB_NOGO
      ? "NO_GO"
      : mm >= PRECIP_TRACE_MM || prob >= PRECIP_PROB_CAUTION
        ? "CAUTION"
        : "GO";
  // `value` carries probability — the headline figure the UI shows for rain.
  return { metric: "precip", verdict, value: precipProbability, available: true };
}

/** Most conservative verdict in the list; GO when the list is empty. */
export function worstVerdict(verdicts: Verdict[]): Verdict {
  return verdicts.reduce<Verdict>(
    (worst, v) => (VERDICT_SEVERITY[v] > VERDICT_SEVERITY[worst] ? v : worst),
    "GO",
  );
}

// ---------------------------------------------------------------------------
// Demo window
// ---------------------------------------------------------------------------

function hourOf(isoLocal: string): number {
  return Number(isoLocal.slice(11, 13));
}

/**
 * True when an hour falls inside the demo window: business hours
 * (`BUSINESS_START_HOUR`–`BUSINESS_END_HOUR`, inclusive) further clamped to
 * daylight (sunrise→sunset) when that information is available — the customer
 * has to be able to see the vessel.
 */
export function isInDemoWindow(
  isoLocal: string,
  daylight: DaylightInfo | null,
): boolean {
  const h = hourOf(isoLocal);
  if (h < BUSINESS_START_HOUR || h > BUSINESS_END_HOUR) return false;
  if (daylight) {
    if (isoLocal < daylight.sunrise || isoLocal > daylight.sunset) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Hour & day scoring
// ---------------------------------------------------------------------------

export function scoreHour(point: HourPoint, inWindow: boolean): ScoredHour {
  const metrics: Record<MetricKey, MetricVerdict> = {
    wind: scoreWind(point.windKn),
    wave: scoreWave(point.waveFt),
    precip: scorePrecip(point.precipMm, point.precipProbability),
    visibility: scoreVisibility(point.visibilityMi),
  };
  const verdict = worstVerdict(
    Object.values(metrics)
      .filter((m) => m.available)
      .map((m) => m.verdict),
  );
  return { ...point, metrics, verdict, inWindow };
}

interface ScoreDayInput {
  date: string;
  hours: HourPoint[];
  daylight: DaylightInfo | null;
  /** Far-out days (8–10) where forecast reliability degrades. */
  lowerConfidence?: boolean;
}

export function scoreDay({
  date,
  hours,
  daylight,
  lowerConfidence = false,
}: ScoreDayInput): DayForecast {
  const scored = hours.map((h) => scoreHour(h, isInDemoWindow(h.time, daylight)));
  const windowHours = scored.filter((h) => h.inWindow);
  // Score the day on the demo window; fall back to all hours if (unusually) none.
  const relevant = windowHours.length > 0 ? windowHours : scored;

  const verdict = worstVerdict(relevant.map((h) => h.verdict));
  const limitingFactor = computeLimitingFactor(relevant, verdict);
  const waveDataAvailable = hours.some((h) => h.waveFt != null);

  return {
    date,
    verdict,
    limitingFactor,
    hours: scored,
    daylight,
    lowerConfidence,
    waveDataAvailable,
  };
}

// ---------------------------------------------------------------------------
// Limiting factor — what (and when) drove the day's verdict
// ---------------------------------------------------------------------------

/** How severe a metric is at a given hour, for picking the headline driver. */
function severity(metric: MetricKey, hour: ScoredHour): number {
  switch (metric) {
    case "wind":
      return (hour.windKn ?? 0) / WIND_NOGO_KN;
    case "wave":
      return (hour.waveFt ?? 0) / WAVE_NOGO_FT;
    case "precip":
      return Math.max(
        (hour.precipMm ?? 0) / PRECIP_NOGO_MM,
        (hour.precipProbability ?? 0) / PRECIP_PROB_NOGO,
      );
    case "visibility":
      return VIS_NOGO_MI / Math.max(hour.visibilityMi ?? 0.1, 0.1);
  }
}

function formatHour(isoLocal: string): string {
  const h = hourOf(isoLocal);
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${period}`;
}

function weatherNote(weatherCode: number | null): string {
  if (weatherCode == null) return "";
  if (weatherCode === 45 || weatherCode === 48) return " · fog";
  if (weatherCode >= 95 && weatherCode <= 99) return " · thunderstorms";
  return "";
}

function describe(metric: MetricKey, hour: ScoredHour): { value: number | null; label: string } {
  const at = `at ${formatHour(hour.time)}`;
  const note = weatherNote(hour.weatherCode);
  switch (metric) {
    case "wind":
      return { value: hour.windKn, label: `wind ${Math.round(hour.windKn ?? 0)} kn ${at}${note}` };
    case "wave":
      return { value: hour.waveFt, label: `waves ${hour.waveFt} ft ${at}${note}` };
    case "precip":
      return {
        value: hour.precipProbability,
        label: `rain ${Math.round(hour.precipProbability ?? 0)}% ${at}${note}`,
      };
    case "visibility":
      return {
        value: hour.visibilityMi,
        label: `low visibility ${hour.visibilityMi} mi ${at}${note}`,
      };
  }
}

/**
 * The single condition (and hour) most responsible for the day's verdict.
 * Returns `null` on a clean GO. Among all metric-instances matching the day
 * verdict, the most severe wins; ties break to the earliest hour.
 */
export function computeLimitingFactor(
  hours: ScoredHour[],
  dayVerdict: Verdict,
): LimitingFactor | null {
  if (dayVerdict === "GO") return null;

  const metricKeys: MetricKey[] = ["wind", "wave", "precip", "visibility"];
  let best: { metric: MetricKey; hour: ScoredHour; sev: number } | null = null;

  for (const hour of hours) {
    for (const metric of metricKeys) {
      const mv = hour.metrics[metric];
      if (!mv.available || mv.verdict !== dayVerdict) continue;
      const sev = severity(metric, hour);
      if (!best || sev > best.sev) {
        best = { metric, hour, sev };
      }
    }
  }

  if (!best) return null;
  const { value, label } = describe(best.metric, best.hour);
  return { metric: best.metric, verdict: dayVerdict, value, time: best.hour.time, label };
}
