# CLAUDE.md

Guidance for working in this repository.

## Project Purpose

**Gulfport Demo Weather Look-Ahead** — a 10-day weather look-ahead for Saronic's Gulf Test Range
(Gulfport, MS · 30.3674, -89.0928) that the Demo Scheduling Coordinator (Tara) checks each morning
to inform go/no-go decisions for customer demos of autonomous surface vessels.

It surfaces the four conditions that matter — **wind, wave height, precipitation, visibility** — and
applies Tara's thresholds to give a per-day **GO / CAUTION / NO-GO** read scoped to a realistic
demo window. It is **decision-support, not a decision-maker**: the raw numbers are always primary
and the human keeps the call.

Full spec / implementation plan:
`C:\Users\Inxxa\.claude\plans\overview-time-estimate-humming-sedgewick.md`

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript** — deployed to **Vercel**.
- **Tailwind CSS v4** for styling (mobile-first, responsive up to a desktop dashboard).
- **Serwist** for PWA (installable, offline app-shell).
- **Vitest** for unit tests (the scoring logic is the primary test target).
- Data: **Open-Meteo** Forecast + Marine APIs (no key required).

> ⚠️ **Next.js 16 is newer than common training data** — APIs/conventions may differ. See root
> `AGENTS.md`; when unsure about a Next/React API, check `node_modules/next/dist/docs/`.

## Dev Setup

```bash
npm install          # install dependencies
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build
npm test             # run Vitest unit tests
npx tsc --noEmit     # TypeScript typecheck gate (must pass with zero errors)
```

## Architecture

`lib/weather/scoring.ts` is **pure and framework-agnostic** — no Next/React imports — so it could be
reused by a future React Native app. All thresholds and demo-window bounds live there as named
constants.

| Module | Responsibility |
|---|---|
| `lib/weather/types.ts` | Domain types: `HourPoint`, `DayForecast`, `Verdict`, `MetricVerdict`, `LimitingFactor`. |
| `lib/weather/units.ts` | Unit conversions: wave m→ft, visibility m→mi (wind requested directly in kn). |
| `lib/weather/openMeteo.ts` | Fetch + parse both Open-Meteo APIs; merge hourly series by ISO timestamp; attach daily sunrise/sunset. |
| `lib/weather/scoring.ts` | Go/no-go logic: per-metric + per-hour verdicts, worst-hour-in-window day verdict, limiting factor. |
| `lib/cache.ts` | localStorage read/write of last good payload + fetch timestamp (offline support). |
| `app/api/forecast/route.ts` | Server Route Handler: calls both upstream APIs, merges, returns one clean typed payload. |
| `app/page.tsx` | Main screen: fetch `/api/forecast`, render, cache, offline fallback. |
| `components/` | `TodayHero`, `DayCard`, `HourlyStrip`, `VerdictPill`, `OfflineBanner`. |

### Conventions

- Scoring stays framework-agnostic and pure; UI never re-implements threshold logic.
- Thresholds / window bounds are named constants in `scoring.ts`, not magic numbers scattered in UI.
- All Open-Meteo requests use `timezone=auto`, so hours and sunrise/sunset come back local to the
  site's resolved timezone (carries over unchanged to future sites). The resolved IANA timezone is
  surfaced in the header.

## Workflow

**The user reviews and commits every phase. Claude never commits or pushes.**

At the end of every phase, Claude runs the **Phase Completion Checklist**, then stops:

1. `npx tsc --noEmit` — must pass with zero errors.
2. Run Vitest — must be green.
3. Update the **Current Status** line below.
4. Summarize the diff + provide a *suggested* commit message, then stop for the user's review and
   commit. (The user authors the actual commit and message.)

## Current Status

**Phase 5 complete** — "Bridge Console" UI. Tokens + fonts in `globals.css`/`layout.tsx` (Saira
Condensed / Inter / JetBrains Mono; deep harbor palette; signal-flag verdict colours). Components:
`VerdictPill`, `HourlyStrip` (signature sea-state ribbon), `MetricReadout`, `DayDetail`,
`DayRailItem`, `ForecastView` (client fetch + master-detail). `app/page.tsx` renders it. Added
`summarizeDay` to `scoring.ts` (per-metric headline reading, 3 tests). UI helpers in `lib/ui/`
(`verdict.ts`, `format.ts`). Suite 45 passing; `next build` clean; live `/api/forecast` verified
(10 days, 8a–5p window, mixed verdicts). Note: `TodayHero` consolidated into `DayDetail` (today is
the default-selected day).

**Phase 6 complete** — `lib/cache.ts` (DI-friendly localStorage cache, defensive against SSR/quota/
corrupt data; `cache.test.ts` 4 tests) + `OfflineBanner` + `ForecastView` rewired for cache-first
hydration (instant render from cache, background refresh) and offline fallback (failed fetch keeps
the cached view + a stale banner with retry). Also switched requests to `timezone=auto` and surfaced
the resolved timezone in the header. Suite 49 passing; build clean.

**Phase 7 complete** — PWA (installable + offline app shell). Decision: skipped the Serwist
dependency (its Turbopack integration is brand-new and risky on Next 16) in favour of a hand-rolled
shell: native `app/manifest.ts`, `public/icon.svg` (sea-state mark), a runtime-caching
`public/sw.js` (navigations network-first→cached shell; static assets cache-first; `/api/*` left to
the page's localStorage cache), and `ServiceWorkerRegister` (production-only). PWA metadata +
apple-web-app in `layout.tsx`. Verified served: `/manifest.webmanifest`, `/sw.js`, `/icon.svg` all
200 and manifest auto-linked. Suite 49 passing; build clean. **Next: Phase 8** — polish, edge-case
passes, deploy to Vercel.
