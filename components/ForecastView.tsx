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

function readCachedForecast(): Forecast | null {
  return loadForecast()?.forecast ?? null;
}

export function ForecastView() {
  const [forecast, setForecast] = useState<Forecast | null>(readCachedForecast);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    () => readCachedForecast()?.days[0]?.date ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => readCachedForecast() == null);
  const [stale, setStale] = useState(false);

  const applyForecast = useCallback((data: Forecast) => {
    setForecast(data);
    setSelectedDate((prev) => prev ?? data.days[0]?.date ?? null);
  }, []);

  // Stale-while-revalidate: initial state comes from cache (see useState above);
  // this fetch refreshes live data, or flags stale / errors when offline.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/forecast");
      if (!res.ok) throw new Error("unavailable");
      const data = (await res.json()) as Forecast;
      applyForecast(data);
      saveForecast(data);
      setStale(false);
      setError(null);
    } catch {
      const cached = loadForecast();
      if (cached) {
        applyForecast(cached.forecast);
        setStale(true);
      } else {
        setError(
          "Couldn't load the forecast. Check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [applyForecast]);

  useEffect(() => {
    // Fetch-on-mount. refresh() only calls setState after `await`, so there's no
    // synchronous cascade; the rule flags any effect that transitively sets state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

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
            void refresh();
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
            void refresh();
          }}
        />
      )}

      {/* Header */}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-ink sm:text-2xl">
            Gulfport Demo Look-Ahead
          </h1>
          <p className="mt-0.5 text-sm text-dim">
            10-day go/no-go read for vessel demos.
          </p>
          <p className="mt-0.5 font-mono text-xs text-dim">
            {forecast.site} · {forecast.latitude}, {forecast.longitude} ·
            updated {formatRelativeAge(forecast.fetchedAt)}
            {forecast.timezone && ` · times in ${forecast.timezone}`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-dim">
          {LEGEND.map((v) => (
            <span key={v} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${VERDICT_FILL[v]}`}
                aria-hidden
              />
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
          {days.map((day, i) => {
            const isSelected = day.date === selected.date;
            return (
              <Fragment key={day.date}>
                {/* The selected card is hidden on mobile (the detail below
                    replaces it in place); on desktop it stays in the rail. */}
                <DayRailItem
                  day={day}
                  isToday={i === 0}
                  isSelected={isSelected}
                  onSelect={() => setSelectedDate(day.date)}
                  className={isSelected ? "hidden lg:block" : ""}
                />
                {isSelected && (
                  <div className="lg:hidden">
                    <DayDetail day={day} isToday={i === 0} />
                  </div>
                )}
              </Fragment>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
