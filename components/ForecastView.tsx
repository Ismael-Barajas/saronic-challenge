"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import type { Forecast, Verdict } from "@/lib/weather/types";
import { VERDICT_FILL, VERDICT_LABEL } from "@/lib/ui/verdict";
import { formatRelativeAge } from "@/lib/ui/format";
import { loadForecast, saveForecast } from "@/lib/cache";
import { DayDetail } from "./DayDetail";
import { DayRailItem } from "./DayRailItem";
import { OfflineBanner } from "./OfflineBanner";

const LEGEND: Verdict[] = ["GO", "CAUTION", "NO_GO"];

export function ForecastView() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const applyForecast = useCallback((data: Forecast) => {
    setForecast(data);
    setSelectedDate((prev) => prev ?? data.days[0]?.date ?? null);
  }, []);

  // Fetch live data; if it fails but we have something cached to show, keep
  // showing it and flag the view stale rather than erroring out.
  const refresh = useCallback(
    async (hasFallback: boolean) => {
      setError(null);
      try {
        const res = await fetch("/api/forecast");
        if (!res.ok) throw new Error("unavailable");
        const data = (await res.json()) as Forecast;
        applyForecast(data);
        saveForecast(data);
        setStale(false);
      } catch {
        if (hasFallback) {
          setStale(true);
        } else {
          setError("Couldn't load the forecast. Check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [applyForecast],
  );

  // On mount: hydrate instantly from cache (if any), then refresh in background.
  useEffect(() => {
    const cached = loadForecast();
    if (cached) {
      applyForecast(cached.forecast);
      setLoading(false);
    }
    void refresh(Boolean(cached));
  }, [applyForecast, refresh]);

  if (loading && !forecast) {
    return <p className="p-6 text-sm text-dim">Reading the forecast…</p>;
  }

  if (error && !forecast) {
    return (
      <div className="p-6">
        <p className="text-sm text-nogo">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void refresh(false);
          }}
          className="mt-3 rounded border border-line bg-panel px-3 py-1.5 text-sm text-ink hover:bg-panel-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!forecast) return null;

  const days = forecast.days;
  const selected = days.find((d) => d.date === selectedDate) ?? days[0];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6">
      {stale && (
        <OfflineBanner
          fetchedAt={forecast.fetchedAt}
          onRetry={() => {
            setLoading(true);
            void refresh(true);
          }}
        />
      )}

      {/* Header */}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-ink sm:text-2xl">
            Gulfport Demo Look-Ahead
          </h1>
          <p className="mt-0.5 font-mono text-xs text-dim">
            {forecast.site} · {forecast.latitude}, {forecast.longitude} · updated{" "}
            {formatRelativeAge(forecast.fetchedAt)}
            {forecast.timezone && ` · times in ${forecast.timezone}`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-dim">
          {LEGEND.map((v) => (
            <span key={v} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${VERDICT_FILL[v]}`} aria-hidden />
              {VERDICT_LABEL[v]}
            </span>
          ))}
        </div>
      </header>

      {/* Master–detail: detail pane (desktop) + 10-day rail */}
      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-6">
        <section className="hidden lg:block">
          <DayDetail day={selected} isToday={selected.date === days[0]?.date} />
        </section>

        <aside className="space-y-3">
          {days.map((day, i) => (
            <Fragment key={day.date}>
              <DayRailItem
                day={day}
                isToday={i === 0}
                isSelected={day.date === selected.date}
                onSelect={() => setSelectedDate(day.date)}
              />
              {/* Mobile: selected day expands inline under its rail item. */}
              {day.date === selected.date && (
                <div className="lg:hidden">
                  <DayDetail day={day} isToday={i === 0} />
                </div>
              )}
            </Fragment>
          ))}
        </aside>
      </div>
    </div>
  );
}
