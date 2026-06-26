import type { MetricKey, MetricSummary } from "@/lib/weather/types";
import { VERDICT_FILL } from "@/lib/ui/verdict";
import { METRIC_LABEL, formatMetric } from "@/lib/ui/format";

/**
 * An instrument-style readout: metric label + value (mono numerals) + a status
 * dot. The number is primary — the dot just echoes the verdict.
 */
export function MetricReadout({
  metric,
  summary,
}: {
  metric: MetricKey;
  summary: MetricSummary;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-dim">
        {METRIC_LABEL[metric]}
      </span>
      <span className="flex items-center gap-2 font-mono text-sm text-ink">
        {summary.available ? formatMetric(metric, summary.value) : "n/a"}
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            summary.available ? VERDICT_FILL[summary.verdict] : "bg-dim"
          }`}
          aria-hidden
        />
      </span>
    </div>
  );
}
