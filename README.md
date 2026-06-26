# Gulfport Demo Weather Look-Ahead

A 10-day go/no-go weather read for vessel demos at the **Gulf Test Range, Gulfport, MS**
(30.3674, -89.0928), built for the demo scheduling coordinator to check each morning.

Customer demos of autonomous surface vessels get scrubbed by weather: high wind, rough seas, rain
(bad for optics), or low visibility. This tool pulls those conditions into one screen, applies the
coordinator's own thresholds for a quick **GO / CAUTION / NO-GO** read per day.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm test           # unit tests (Vitest)
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm start          # serve the production build (service worker registers here)
```

No API key needed; data comes from the free [Open-Meteo](https://open-meteo.com) Forecast + Marine
APIs.

## How the read works

1. **Fetch** the Forecast API (wind in knots, precipitation + probability, visibility, weather code,
   sunrise/sunset) and the Marine API (wave height) for Gulfport, with `timezone=auto` so hours are
   site-local.
2. **Merge** the two hourly series **by timestamp** and convert units (m→ft, m→mi); group into days.
3. **Score** each hour against the coordinator's thresholds, then roll up:

   | Metric     | GO            | CAUTION        | NO-GO             |
   | ---------- | ------------- | -------------- | ----------------- |
   | Wind       | < 15 kn       | 15–20 kn       | > 20 kn           |
   | Wave       | < 2 ft        | 2–4 ft         | > 4 ft            |
   | Precip     | dry, low prob | trace / 30–60% | ≥ 0.5 mm or ≥ 60% |
   | Visibility | > 5 mi        | 2–5 mi         | < 2 mi            |
   - An **hour's** verdict = its worst metric.
   - A **day's** verdict = its worst hour **inside the demo window** (conservative on purpose).

4. **Demo window** = daylight (sunrise→sunset) ∩ ~8am–5pm. A demo can't run in the dark and isn't
   run overnight, so off-hours weather never skews the read.

## Key decisions (and what I skipped)

- **Decision-support, not decision-maker.** The verdict is a transparent roll-up of the user's _own_
  thresholds, always shown next to the raw numbers and the limiting factor (e.g. "wind 22 kn at
  2pm"). It never tells anyone to cancel.
- **Per-hour honesty + per-day glance.** The day pill answers the 10-second "which days?" scan; the
  hourly **sea-state ribbon** and hour-by-hour table show the within-day swing that burns schedulers
  (clear morning, rough afternoon).
- **Conservative aggregation.** One bad in-window hour means a day isn't a clean GO.
- **Offline-first for the dock.** Last forecast is cached in `localStorage` and shown instantly on
  open; a failed refresh keeps the cached view with an "offline / data from Xh ago" banner instead
  of an error. An installable PWA (manifest + service worker) lets it open with no signal.
- **Hand-rolled PWA over Serwist.** Serwist's only Next 16 / Turbopack path is brand-new; a minimal
  runtime-caching service worker avoids that risk and stays under our control.
- **Skipped (noted as future):** configurable demo window, a "best contiguous window" finder
  ("schedule Thu 9a–12p"), the other sites (Panama City / Norfolk / San Diego), and a true native
  app. The scoring core is framework-agnostic, so a native app could reuse it.

## Architecture

```
├── app/
│   ├── api/forecast/route.ts   # Server proxy: one scored forecast payload
│   ├── page.tsx                # Main screen
│   ├── layout.tsx              # Root layout, fonts, PWA metadata
│   ├── manifest.ts             # PWA manifest
│   └── globals.css             # Design tokens + Tailwind
├── lib/
│   ├── weather/
│   │   ├── types.ts            # Domain types
│   │   ├── units.ts            # m→ft / m→mi conversions
│   │   ├── scoring.ts          # PURE go/no-go logic (thresholds, demo window, roll-up)
│   │   └── openMeteo.ts        # Fetch + merge both APIs, then score
│   ├── ui/                     # UI helpers (verdict colours, formatting)
│   └── cache.ts               # localStorage cache for offline
├── components/                 # ForecastView, DayDetail, DayRailItem, HourlyStrip,
│                               #   VerdictPill, MetricReadout, OfflineBanner,
│                               #   ServiceWorkerRegister, Footer
└── public/                     # Icons, service worker (sw.js), static assets
```

`scoring.ts` carries no framework imports; it's the graded core and the bulk of the tests, and is
portable to a future native app.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Vitest. Deploys to Vercel.

## Deploy

Push to a Git repo and import it at [vercel.com/new](https://vercel.com/new); no environment
variables required. Or `npx vercel` from the project root.
