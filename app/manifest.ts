import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes the look-ahead installable to a phone home screen and
 * run fullscreen, so Tara can open it like an app each morning. Next serves
 * this at /manifest.webmanifest and links it automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gulfport Demo Look-Ahead",
    short_name: "Look-Ahead",
    description:
      "10-day go/no-go weather read for vessel demos at the Gulf Test Range.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1b24",
    theme_color: "#0a1b24",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
