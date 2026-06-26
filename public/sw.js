/*
 * Minimal app-shell service worker.
 *
 * Goal: let the app *open* with no signal. Strategy by request type:
 *   - /api/*          → not handled here; the page caches forecast data itself
 *                       in localStorage (see lib/cache.ts).
 *   - navigations     → network-first, falling back to the cached shell offline.
 *   - static assets   → cache-first (Next's hashed /_next/static, fonts, icons).
 *
 * Runtime caching (vs. a precise precache manifest) keeps this independent of
 * Next's hashed build output — no build step, nothing to regenerate.
 */
const CACHE = "gulfport-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function cachePut(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") return;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through
  if (url.pathname.startsWith("/api/")) return; // data handled in the page

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          cachePut(request, res);
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          cachePut(request, res);
          return res;
        }),
    ),
  );
});
