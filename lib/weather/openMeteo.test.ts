import { describe, expect, it } from "vitest";
import {
  GULFPORT,
  buildForecast,
  buildForecastUrl,
  buildMarineUrl,
  type OMForecast,
  type OMMarine,
} from "./openMeteo";

const sampleForecast: OMForecast = {
  timezone: "America/Chicago",
  timezone_abbreviation: "GMT-5",
  hourly: {
    time: ["2026-06-26T08:00", "2026-06-26T09:00"],
    wind_speed_10m: [10, 12],
    precipitation: [0, 0],
    precipitation_probability: [5, 10],
    visibility: [16093.44, 16093.44], // ~10 statute miles
    weather_code: [0, 1],
  },
  daily: {
    time: ["2026-06-26"],
    sunrise: ["2026-06-26T06:00"],
    sunset: ["2026-06-26T20:00"],
  },
};

const sampleMarine: OMMarine = {
  hourly: {
    time: ["2026-06-26T08:00", "2026-06-26T09:00"],
    wave_height: [0.305, null], // ~1ft, then missing
  },
};

/** Build an N-day forecast with one noon hour per day (for window/order tests). */
function multiDayForecast(n: number): OMForecast {
  const dates = Array.from({ length: n }, (_, i) =>
    `2026-07-${String(i + 1).padStart(2, "0")}`,
  );
  return {
    hourly: {
      time: dates.map((d) => `${d}T12:00`),
      wind_speed_10m: dates.map(() => 8),
      precipitation: dates.map(() => 0),
      precipitation_probability: dates.map(() => 0),
      visibility: dates.map(() => 16093.44),
      weather_code: dates.map(() => 0),
    },
    daily: {
      time: dates,
      sunrise: dates.map((d) => `${d}T06:00`),
      sunset: dates.map((d) => `${d}T20:00`),
    },
  };
}

describe("URL builders", () => {
  it("requests the conditions Tara cares about, in knots and site-local time", () => {
    const url = buildForecastUrl();
    expect(url).toContain("wind_speed_10m");
    expect(url).toContain("visibility");
    expect(url).toContain("precipitation_probability");
    expect(url).toContain("wind_speed_unit=kn");
    expect(url).toContain("timezone=auto"); // resolved from coordinates
    expect(url).toContain(`latitude=${GULFPORT.latitude}`);
  });

  it("requests wave height from the marine API", () => {
    expect(buildMarineUrl()).toContain("wave_height");
  });
});

describe("buildForecast", () => {
  it("merges wave height by timestamp and converts units", () => {
    const forecast = buildForecast(sampleForecast, sampleMarine);
    const day = forecast.days[0];
    expect(day.date).toBe("2026-06-26");
    expect(day.hours[0].waveFt).toBe(1.0); // 0.305m -> ~1ft
    expect(day.hours[0].visibilityMi).toBe(10); // 16093.44m -> 10mi
    expect(day.hours[0].windKn).toBe(10);
    expect(day.hours[1].waveFt).toBeNull(); // missing marine entry
    expect(day.waveDataAvailable).toBe(true);
  });

  it("attaches daylight per day", () => {
    const day = buildForecast(sampleForecast, sampleMarine).days[0];
    expect(day.daylight).toEqual({
      sunrise: "2026-06-26T06:00",
      sunset: "2026-06-26T20:00",
    });
  });

  it("degrades gracefully when the marine API is unavailable", () => {
    const forecast = buildForecast(sampleForecast, null);
    const day = forecast.days[0];
    expect(day.waveDataAvailable).toBe(false);
    expect(day.hours[0].waveFt).toBeNull();
  });

  it("groups into ordered days and flags days 8–10 as lower confidence", () => {
    const forecast = buildForecast(multiDayForecast(10), null);
    expect(forecast.days).toHaveLength(10);
    expect(forecast.days[0].lowerConfidence).toBe(false);
    expect(forecast.days[6].lowerConfidence).toBe(false);
    expect(forecast.days[7].lowerConfidence).toBe(true); // 8th day
    expect(forecast.days[9].lowerConfidence).toBe(true);
  });

  it("carries site metadata including the resolved timezone", () => {
    const forecast = buildForecast(sampleForecast, sampleMarine);
    expect(forecast.latitude).toBe(GULFPORT.latitude);
    expect(forecast.site).toContain("Gulfport");
    expect(forecast.timezone).toBe("America/Chicago");
  });
});
