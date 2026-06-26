import type { DayForecast, MetricKey } from "@/lib/weather/types";
import { summarizeDay } from "@/lib/weather/scoring";
import { VERDICT_FILL, VERDICT_TEXT, verdictPhrase } from "@/lib/ui/verdict";
import {
  METRIC_LABEL,
  formatHour,
  formatMetric,
  formatMonthDay,
  formatWeekday,
} from "@/lib/ui/format";
import { VerdictPill } from "./VerdictPill";
import { MetricReadout } from "./MetricReadout";
import { HourlyStrip } from "./HourlyStrip";

const METRIC_ORDER: MetricKey[] = ["wind", "wave", "precip", "visibility"];

/** The full read for one day: verdict, why, the four metrics, and hour-by-hour. */
export function DayDetail({
  day,
  isToday = false,
}: {
  day: DayForecast;
  isToday?: boolean;
}) {
  const summary = summarizeDay(day);
  const windowHours = day.hours.filter((h) => h.inWindow);

  return (
    <div className="rounded-lg border border-line bg-panel/60 p-5 shadow-lg shadow-black/20">
      {/* Heading */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isToday && (
              <span className="rounded bg-accent/15 px-1.5 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-accent">
                Today
              </span>
            )}
            <h2 className="font-display text-2xl font-bold tracking-wide text-ink">
              {formatWeekday(day.date)} · {formatMonthDay(day.date)}
            </h2>
          </div>
          {day.lowerConfidence && (
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-dim">
              ~ further out · lower confidence
            </p>
          )}
        </div>
        <VerdictPill verdict={day.verdict} size="lg" />
      </div>

      {/* Plain-language read + why */}
      <p className={`mt-3 font-display text-lg ${VERDICT_TEXT[day.verdict]}`}>
        {verdictPhrase(day.verdict, day.limitingFactor)}
      </p>
      {day.limitingFactor && (
        <p className="mt-0.5 text-sm text-dim">
          Limiting factor: {day.limitingFactor.label}
        </p>
      )}
      {!day.waveDataAvailable && (
        <p className="mt-0.5 text-xs text-dim">
          Wave data unavailable — scored on wind, rain &amp; visibility.
        </p>
      )}

      {/* Metric readouts */}
      <div className="mt-4 grid grid-cols-2 gap-x-6">
        {METRIC_ORDER.map((m) => (
          <MetricReadout key={m} metric={m} summary={summary[m]} />
        ))}
      </div>

      {/* Demo-window ribbon */}
      <div className="mt-5">
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-dim">
          Demo window
        </p>
        <HourlyStrip hours={day.hours} showLabels />
      </div>

      {/* Hour-by-hour table */}
      {windowHours.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-dim">
            Hour by hour
          </p>
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-dim">
                <th className="py-1 text-left font-normal">Hr</th>
                {METRIC_ORDER.map((m) => (
                  <th key={m} className="py-1 text-right font-normal">
                    {METRIC_LABEL[m]}
                  </th>
                ))}
                <th className="py-1 pl-2 text-right font-normal">Read</th>
              </tr>
            </thead>
            <tbody>
              {windowHours.map((h) => (
                <tr key={h.time} className="border-t border-line/30">
                  <td className="py-1 text-left text-ink">{formatHour(h.time)}</td>
                  <td className="py-1 text-right">{formatMetric("wind", h.windKn)}</td>
                  <td className="py-1 text-right">{formatMetric("wave", h.waveFt)}</td>
                  <td className="py-1 text-right">
                    {formatMetric("precip", h.precipProbability)}
                  </td>
                  <td className="py-1 text-right">
                    {formatMetric("visibility", h.visibilityMi)}
                  </td>
                  <td className="py-1 pl-2 text-right">
                    <span
                      className={`ml-auto inline-block h-2 w-2 rounded-full ${VERDICT_FILL[h.verdict]}`}
                      aria-label={h.verdict}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
