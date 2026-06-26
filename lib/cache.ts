/**
 * Last-good-forecast cache in localStorage. Lets the app open and stay useful
 * dockside when the signal drops — it shows the most recent forecast (clearly
 * labelled stale) instead of an error. All access is defensive: storage can be
 * unavailable (SSR, private mode) or throw (quota), and we degrade to no cache.
 */
import type { Forecast } from "./weather/types";

const CACHE_KEY = "gulfport-forecast-v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export interface CachedForecast {
  forecast: Forecast;
  /** Epoch ms when this entry was written. */
  cachedAt: number;
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Persist the latest forecast. Failures (quota / private mode) are ignored. */
export function saveForecast(
  forecast: Forecast,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    const payload: CachedForecast = { forecast, cachedAt: Date.now() };
    storage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* storage full or unavailable — nothing to do */
  }
}

/** Read the cached forecast, or `null` if absent/corrupt. */
export function loadForecast(
  storage: StorageLike | null = defaultStorage(),
): CachedForecast | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedForecast;
    if (!parsed?.forecast?.days) return null;
    return parsed;
  } catch {
    return null;
  }
}
