import { describe, expect, it } from "vitest";
import type { HourPoint } from "./types";
import {
  isInDemoWindow,
  scoreDay,
  scoreHour,
  scorePrecip,
  scoreVisibility,
  scoreWave,
  scoreWind,
  worstVerdict,
} from "./scoring";

/** Build an HourPoint with sensible "all clear" defaults, overridable. */
function hour(time: string, overrides: Partial<HourPoint> = {}): HourPoint {
  return {
    time,
    windKn: 8,
    waveFt: 1.0,
    precipMm: 0,
    precipProbability: 0,
    visibilityMi: 10,
    weatherCode: 0,
    ...overrides,
  };
}

describe("scoreWind", () => {
  it("is GO below 15 kn", () => {
    expect(scoreWind(14).verdict).toBe("GO");
  });
  it("is CAUTION across the 15–20 kn band (inclusive)", () => {
    expect(scoreWind(15).verdict).toBe("CAUTION");
    expect(scoreWind(20).verdict).toBe("CAUTION");
  });
  it("is NO_GO above 20 kn", () => {
    expect(scoreWind(20.1).verdict).toBe("NO_GO");
    expect(scoreWind(25).verdict).toBe("NO_GO");
  });
  it("reports unavailable for missing data", () => {
    expect(scoreWind(null)).toMatchObject({ available: false });
  });
});

describe("scoreWave", () => {
  it("is GO below 2 ft", () => {
    expect(scoreWave(1.9).verdict).toBe("GO");
  });
  it("is CAUTION across the 2–4 ft band (inclusive)", () => {
    expect(scoreWave(2).verdict).toBe("CAUTION");
    expect(scoreWave(4).verdict).toBe("CAUTION");
  });
  it("is NO_GO above 4 ft", () => {
    expect(scoreWave(4.1).verdict).toBe("NO_GO");
  });
  it("reports unavailable for missing data", () => {
    expect(scoreWave(null)).toMatchObject({ available: false });
  });
});

describe("scoreVisibility", () => {
  it("is GO above 5 mi", () => {
    expect(scoreVisibility(6).verdict).toBe("GO");
  });
  it("is CAUTION across the 2–5 mi band (inclusive)", () => {
    expect(scoreVisibility(5).verdict).toBe("CAUTION");
    expect(scoreVisibility(2).verdict).toBe("CAUTION");
  });
  it("is NO_GO below 2 mi", () => {
    expect(scoreVisibility(1.9).verdict).toBe("NO_GO");
  });
  it("reports unavailable for missing data", () => {
    expect(scoreVisibility(null)).toMatchObject({ available: false });
  });
});

describe("scorePrecip", () => {
  it("is GO when dry and low probability", () => {
    expect(scorePrecip(0, 10).verdict).toBe("GO");
  });
  it("is CAUTION on moderate probability", () => {
    expect(scorePrecip(0, 30).verdict).toBe("CAUTION");
    expect(scorePrecip(0, 59).verdict).toBe("CAUTION");
  });
  it("is CAUTION on a trace of rain even at low probability", () => {
    expect(scorePrecip(0.2, 10).verdict).toBe("CAUTION");
  });
  it("is NO_GO at high probability", () => {
    expect(scorePrecip(0, 60).verdict).toBe("NO_GO");
  });
  it("is NO_GO on measurable rain (optics-strict)", () => {
    expect(scorePrecip(0.5, 0).verdict).toBe("NO_GO");
  });
  it("reports unavailable when both inputs missing", () => {
    expect(scorePrecip(null, null)).toMatchObject({ available: false });
  });
});

describe("worstVerdict", () => {
  it("returns the most conservative verdict present", () => {
    expect(worstVerdict(["GO", "CAUTION", "GO"])).toBe("CAUTION");
    expect(worstVerdict(["GO", "CAUTION", "NO_GO"])).toBe("NO_GO");
    expect(worstVerdict(["GO", "GO"])).toBe("GO");
  });
  it("defaults to GO when nothing to score", () => {
    expect(worstVerdict([])).toBe("GO");
  });
});

describe("isInDemoWindow", () => {
  it("excludes overnight hours outside business hours", () => {
    expect(isInDemoWindow("2026-06-26T02:00", null)).toBe(false);
    expect(isInDemoWindow("2026-06-26T07:00", null)).toBe(false);
  });
  it("includes business hours when no daylight info", () => {
    expect(isInDemoWindow("2026-06-26T10:00", null)).toBe(true);
    expect(isInDemoWindow("2026-06-26T17:00", null)).toBe(true);
  });
  it("excludes business hours that fall before sunrise / after sunset", () => {
    const daylight = { sunrise: "2026-06-26T09:00", sunset: "2026-06-26T15:00" };
    expect(isInDemoWindow("2026-06-26T08:00", daylight)).toBe(false); // before sunrise
    expect(isInDemoWindow("2026-06-26T09:00", daylight)).toBe(true);
    expect(isInDemoWindow("2026-06-26T16:00", daylight)).toBe(false); // after sunset
  });
});

describe("scoreHour", () => {
  it("takes the worst metric as the hour verdict", () => {
    const scored = scoreHour(hour("2026-06-26T14:00", { windKn: 25 }), true);
    expect(scored.verdict).toBe("NO_GO");
    expect(scored.inWindow).toBe(true);
  });
  it("ignores missing wave data without crashing", () => {
    const scored = scoreHour(hour("2026-06-26T14:00", { waveFt: null }), true);
    expect(scored.verdict).toBe("GO");
    expect(scored.metrics.wave.available).toBe(false);
  });
});

describe("scoreDay", () => {
  const daylight = { sunrise: "2026-06-26T06:00", sunset: "2026-06-26T20:00" };

  it("is a clean GO when all in-window hours are clear", () => {
    const hours = ["09:00", "12:00", "15:00"].map((t) => hour(`2026-06-26T${t}`));
    const day = scoreDay({ date: "2026-06-26", hours, daylight });
    expect(day.verdict).toBe("GO");
    expect(day.limitingFactor).toBeNull();
  });

  it("takes the worst in-window hour and names the limiting factor + time", () => {
    const hours = [
      hour("2026-06-26T09:00"),
      hour("2026-06-26T14:00", { windKn: 22 }), // the bad afternoon hour
      hour("2026-06-26T16:00"),
    ];
    const day = scoreDay({ date: "2026-06-26", hours, daylight });
    expect(day.verdict).toBe("NO_GO");
    expect(day.limitingFactor?.metric).toBe("wind");
    expect(day.limitingFactor?.time).toBe("2026-06-26T14:00");
    expect(day.limitingFactor?.label.toLowerCase()).toContain("wind");
    expect(day.limitingFactor?.label).toContain("2");
  });

  it("ignores bad weather outside the demo window", () => {
    const hours = [
      hour("2026-06-26T02:00", { windKn: 40, waveFt: 8 }), // overnight storm, out of window
      hour("2026-06-26T10:00"),
      hour("2026-06-26T14:00"),
    ];
    const day = scoreDay({ date: "2026-06-26", hours, daylight });
    expect(day.verdict).toBe("GO");
  });

  it("flags wave data as unavailable when missing for the day", () => {
    const hours = ["09:00", "14:00"].map((t) =>
      hour(`2026-06-26T${t}`, { waveFt: null }),
    );
    const day = scoreDay({ date: "2026-06-26", hours, daylight });
    expect(day.waveDataAvailable).toBe(false);
    expect(day.verdict).toBe("GO"); // still scored on the other metrics
  });
});
