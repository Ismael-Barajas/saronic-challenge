"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker (production only — a service worker in
 * dev fights hot reload). Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort; the app works without it */
    });
  }, []);

  return null;
}
