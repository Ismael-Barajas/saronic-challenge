"use client";

import type { DayForecast } from "@/lib/weather/types";
import { VerdictPill } from "./VerdictPill";
import { HourlyStrip } from "./HourlyStrip";
import { formatMonthDay, formatWeekday } from "@/lib/ui/format";

/**
 * One day in the 10-day rail: weekday, verdict, a mini sea-state ribbon, and the
 * limiting factor. Scanning the column of these is the 10-second morning glance.
 */
export function DayRailItem({
  day,
  isToday,
  isSelected,
  onSelect,
}: {
  day: DayForecast;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        isSelected
          ? "border-accent/70 bg-panel-2"
          : "border-line bg-panel/40 hover:bg-panel-2/60"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base font-semibold tracking-wide text-ink">
          {isToday ? "Today" : formatWeekday(day.date)}
          <span className="ml-1.5 font-mono text-xs font-normal text-dim">
            {formatMonthDay(day.date)}
            {day.lowerConfidence && " ~"}
          </span>
        </span>
        <VerdictPill verdict={day.verdict} />
      </div>

      <div className="mt-2">
        <HourlyStrip hours={day.hours} />
      </div>

      <p className="mt-2 truncate text-xs text-dim">
        {day.limitingFactor ? day.limitingFactor.label : "All clear in window"}
      </p>
    </button>
  );
}
