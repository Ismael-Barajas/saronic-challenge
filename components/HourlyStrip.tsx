import type { ScoredHour } from "@/lib/weather/types";
import { VERDICT_FILL, VERDICT_LABEL } from "@/lib/ui/verdict";
import { formatHour } from "@/lib/ui/format";

/**
 * Signature element: the day's demo window rendered as a sea-state ribbon — one
 * segment per in-window hour, coloured by that hour's verdict. Lets Tara see the
 * within-day swing ("clear morning, rough afternoon") at a glance.
 */
export function HourlyStrip({
  hours,
  showLabels = false,
}: {
  hours: ScoredHour[];
  showLabels?: boolean;
}) {
  const windowHours = hours.filter((h) => h.inWindow);

  if (windowHours.length === 0) {
    return (
      <div className="text-[11px] uppercase tracking-wide text-dim">
        No daylight demo window
      </div>
    );
  }

  const first = windowHours[0];
  const last = windowHours[windowHours.length - 1];

  return (
    <div>
      <div className="flex h-2.5 gap-px overflow-hidden rounded-full ring-1 ring-line/60">
        {windowHours.map((h) => (
          <div
            key={h.time}
            className={`flex-1 ${VERDICT_FILL[h.verdict]}`}
            title={`${formatHour(h.time)} — ${VERDICT_LABEL[h.verdict]}`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
          <span>{formatHour(first.time)}</span>
          <span>{formatHour(last.time)}</span>
        </div>
      )}
    </div>
  );
}
