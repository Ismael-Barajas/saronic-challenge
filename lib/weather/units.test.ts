import { describe, expect, it } from "vitest";
import { metersToFeet, metersToMiles, roundTo } from "./units";

describe("roundTo", () => {
  it("rounds to one decimal by default", () => {
    expect(roundTo(1.234)).toBe(1.2);
    expect(roundTo(1.25)).toBe(1.3);
  });

  it("respects a custom precision", () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
  });
});

describe("metersToFeet", () => {
  it("converts metres to feet", () => {
    expect(metersToFeet(1)).toBe(3.3);
    expect(metersToFeet(1.22)).toBe(4); // ~4ft, the rough-seas threshold
  });

  it("passes through null/undefined/NaN", () => {
    expect(metersToFeet(null)).toBeNull();
    expect(metersToFeet(undefined)).toBeNull();
    expect(metersToFeet(NaN)).toBeNull();
  });
});

describe("metersToMiles", () => {
  it("converts metres to statute miles", () => {
    expect(metersToMiles(1609.344)).toBe(1);
    expect(metersToMiles(16093.44)).toBe(10);
  });

  it("passes through null/undefined/NaN", () => {
    expect(metersToMiles(null)).toBeNull();
    expect(metersToMiles(undefined)).toBeNull();
    expect(metersToMiles(NaN)).toBeNull();
  });
});
