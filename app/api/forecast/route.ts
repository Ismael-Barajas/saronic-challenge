import { fetchForecast } from "@/lib/weather/openMeteo";

/**
 * GET /api/forecast
 *
 * Server-side proxy that calls both Open-Meteo APIs, merges + scores them, and
 * returns one clean `Forecast` payload. Keeps the client thin and avoids any
 * CORS handling. Upstream responses are cached ~30 min (see `openMeteo.ts`);
 * the client additionally caches the last good payload for offline use.
 */
export async function GET() {
  try {
    const forecast = await fetchForecast();
    return Response.json(forecast);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error fetching forecast.";
    return Response.json({ error: message }, { status: 502 });
  }
}
