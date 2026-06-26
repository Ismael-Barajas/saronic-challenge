import {
  BUSINESS_END_HOUR,
  BUSINESS_START_HOUR,
  VIS_NOGO_MI,
  WAVE_NOGO_FT,
  WIND_NOGO_KN,
} from "@/lib/weather/scoring";

/**
 * Standing context that doesn't change per day: how to read the tool, the demo
 * window definition, the thresholds, and data attribution. Reinforces that this
 * informs the call rather than makes it.
 */
export function Footer() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-[1600px] px-4 pb-8 pt-6 sm:px-6">
      <div className="space-y-1.5 border-t border-line pt-4 text-xs leading-relaxed text-dim">
        <p>
          A day&apos;s read is its most conservative hour inside the demo
          window, daylight (sunrise–sunset) ∩ {BUSINESS_START_HOUR}am–
          {BUSINESS_END_HOUR - 12}pm.
        </p>
        <p>
          No-go thresholds: wind &gt; {WIND_NOGO_KN} kn · waves &gt; {WAVE_NOGO_FT}{" "}
          ft · rain (esp. for optics) · visibility &lt; {VIS_NOGO_MI} mi. Weather
          &amp; marine data from{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Open-Meteo
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
