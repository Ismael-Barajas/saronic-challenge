/**
 * Unit conversions for upstream Open-Meteo values.
 *
 * Open-Meteo returns wave height and visibility in metres; we display wave
 * height in feet and visibility in statute miles. Wind is requested directly in
 * knots (`wind_speed_unit=kn`), so no conversion is needed for it.
 *
 * All helpers tolerate `null`/`undefined` and pass it through, so callers can
 * pipe raw API values (which may be missing) without guarding first.
 */

const FEET_PER_METER = 3.280839895;
const METERS_PER_MILE = 1609.344;

/** Round to a fixed number of decimal places (default 1). */
export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Metres → feet (e.g. wave height). Returns `null` for missing input. */
export function metersToFeet(meters: number | null | undefined): number | null {
  if (meters == null || Number.isNaN(meters)) return null;
  return roundTo(meters * FEET_PER_METER);
}

/** Metres → statute miles (e.g. visibility). Returns `null` for missing input. */
export function metersToMiles(meters: number | null | undefined): number | null {
  if (meters == null || Number.isNaN(meters)) return null;
  return roundTo(meters / METERS_PER_MILE);
}
