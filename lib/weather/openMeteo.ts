/**
 * Open-Meteo data access: fetch the Forecast + Marine APIs, merge their hourly
 * series by timestamp, convert units, and score each day into a `Forecast`.
 *
 * The merge/parse/score logic lives in the pure `buildForecast` so it is unit
 * tested without the network; `fetchForecast` is the thin networked wrapper.
 */

import { scoreDay } from "./scoring";
import type { DaylightInfo, Forecast, HourPoint } from "./types";
import { metersToFeet, metersToMiles } from "./units";

/** The Gulf Test Range — the only site in scope for now. */
export const GULFPORT = {
  name: "Gulf Test Range — Gulfport, MS",
  latitude: 30.37,
  longitude: -89.09,
} as const;

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";
const TIMEZONE = "America/Chicago"; // Gulfport is Central — keep hours/sun local.
const FORECAST_DAYS = 10;
/** Days beyond this index (0-based) are flagged lower-confidence (days 8–10). */
const LOWER_CONFIDENCE_FROM_INDEX = 7;
/** Cache upstream responses ~30 min to be kind to the free API. */
const REVALIDATE_SECONDS = 1800;

// --- Upstream response shapes (only the fields we request) -------------------

export interface OMForecast {
  hourly: {
    time: string[];
    wind_speed_10m: (number | null)[];
    precipitation: (number | null)[];
    precipitation_probability: (number | null)[];
    visibility: (number | null)[];
    weather_code: (number | null)[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface OMMarine {
  hourly: {
    time: string[];
    wave_height: (number | null)[];
    wind_wave_height?: (number | null)[];
    swell_wave_height?: (number | null)[];
  };
}

// --- URL builders ------------------------------------------------------------

export function buildForecastUrl(): string {
  const params = new URLSearchParams({
    latitude: String(GULFPORT.latitude),
    longitude: String(GULFPORT.longitude),
    hourly:
      "wind_speed_10m,precipitation,precipitation_probability,visibility,weather_code",
    daily: "sunrise,sunset",
    wind_speed_unit: "kn",
    timezone: TIMEZONE,
    forecast_days: String(FORECAST_DAYS),
  });
  return `${FORECAST_BASE}?${params}`;
}

export function buildMarineUrl(): string {
  const params = new URLSearchParams({
    latitude: String(GULFPORT.latitude),
    longitude: String(GULFPORT.longitude),
    hourly: "wave_height,wind_wave_height,swell_wave_height",
    timezone: TIMEZONE,
    forecast_days: String(FORECAST_DAYS),
  });
  return `${MARINE_BASE}?${params}`;
}

// --- Pure parse / merge / score ---------------------------------------------

function dateOf(isoLocal: string): string {
  return isoLocal.slice(0, 10);
}

/**
 * Merge both APIs into scored days. Pure — given already-parsed JSON. `marine`
 * may be `null` (API unavailable); wave height then stays absent and days are
 * scored on the remaining metrics.
 */
export function buildForecast(
  forecast: OMForecast,
  marine: OMMarine | null,
  meta: { fetchedAt?: string } = {},
): Forecast {
  // Index marine wave height by timestamp so misaligned arrays still line up.
  const waveByTime = new Map<string, number | null>();
  if (marine) {
    marine.hourly.time.forEach((t, i) => {
      waveByTime.set(t, marine.hourly.wave_height[i] ?? null);
    });
  }

  // Build every hour point, keyed by date.
  const hoursByDate = new Map<string, HourPoint[]>();
  forecast.hourly.time.forEach((time, i) => {
    const point: HourPoint = {
      time,
      windKn: forecast.hourly.wind_speed_10m[i] ?? null,
      precipMm: forecast.hourly.precipitation[i] ?? null,
      precipProbability: forecast.hourly.precipitation_probability[i] ?? null,
      visibilityMi: metersToMiles(forecast.hourly.visibility[i]),
      weatherCode: forecast.hourly.weather_code[i] ?? null,
      waveFt: metersToFeet(waveByTime.get(time) ?? null),
    };
    const date = dateOf(time);
    const bucket = hoursByDate.get(date);
    if (bucket) bucket.push(point);
    else hoursByDate.set(date, [point]);
  });

  // Daylight by date.
  const daylightByDate = new Map<string, DaylightInfo>();
  forecast.daily.time.forEach((date, i) => {
    daylightByDate.set(date, {
      sunrise: forecast.daily.sunrise[i],
      sunset: forecast.daily.sunset[i],
    });
  });

  // Order days by the daily series; score each.
  const days = forecast.daily.time.slice(0, FORECAST_DAYS).map((date, index) =>
    scoreDay({
      date,
      hours: hoursByDate.get(date) ?? [],
      daylight: daylightByDate.get(date) ?? null,
      lowerConfidence: index >= LOWER_CONFIDENCE_FROM_INDEX,
    }),
  );

  return {
    site: GULFPORT.name,
    latitude: GULFPORT.latitude,
    longitude: GULFPORT.longitude,
    fetchedAt: meta.fetchedAt ?? new Date().toISOString(),
    days,
  };
}

// --- Networked wrapper -------------------------------------------------------

/**
 * Fetch and score the live 10-day Gulfport forecast. The forecast API is
 * required; the marine API is best-effort — if it fails we degrade rather than
 * fail the whole request.
 */
export async function fetchForecast(): Promise<Forecast> {
  const fetchOpts = { next: { revalidate: REVALIDATE_SECONDS } } as RequestInit;

  const [forecastRes, marineRes] = await Promise.allSettled([
    fetch(buildForecastUrl(), fetchOpts),
    fetch(buildMarineUrl(), fetchOpts),
  ]);

  if (forecastRes.status !== "fulfilled" || !forecastRes.value.ok) {
    throw new Error("Failed to fetch the weather forecast from Open-Meteo.");
  }
  const forecastJson = (await forecastRes.value.json()) as OMForecast;

  let marineJson: OMMarine | null = null;
  if (marineRes.status === "fulfilled" && marineRes.value.ok) {
    marineJson = (await marineRes.value.json()) as OMMarine;
  }

  return buildForecast(forecastJson, marineJson);
}
