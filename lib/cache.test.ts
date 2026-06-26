import { describe, expect, it } from "vitest";
import type { Forecast } from "./weather/types";
import { loadForecast, saveForecast } from "./cache";

/** Minimal in-memory Storage stand-in for tests. */
function fakeStorage(): Pick<Storage, "getItem" | "setItem"> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const forecast: Forecast = {
  site: "Gulf Test Range — Gulfport, MS",
  latitude: 30.37,
  longitude: -89.09,
  timezone: "America/Chicago",
  timezoneAbbreviation: "GMT-5",
  fetchedAt: "2026-06-26T12:00:00.000Z",
  days: [],
};

describe("forecast cache", () => {
  it("round-trips a saved forecast", () => {
    const storage = fakeStorage();
    saveForecast(forecast, storage);
    const loaded = loadForecast(storage);
    expect(loaded?.forecast.site).toBe(forecast.site);
    expect(typeof loaded?.cachedAt).toBe("number");
  });

  it("returns null when nothing is cached", () => {
    expect(loadForecast(fakeStorage())).toBeNull();
  });

  it("returns null on corrupt data instead of throwing", () => {
    const storage = fakeStorage();
    storage.setItem("gulfport-forecast-v1", "{not json");
    expect(loadForecast(storage)).toBeNull();
  });

  it("swallows write failures (quota / private mode)", () => {
    const throwing: Pick<Storage, "getItem" | "setItem"> = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };
    expect(() => saveForecast(forecast, throwing)).not.toThrow();
  });
});
