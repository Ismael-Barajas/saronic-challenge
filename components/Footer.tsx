/**
 * Standing context that doesn't change per day: how to read the tool, the demo
 * window definition, the thresholds, and data attribution. Reinforces that this
 * informs the call rather than makes it.
 */
export function Footer() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-[1600px] px-4 pb-8 pt-6 sm:px-6">
      <div className="space-y-1.5 border-t border-line pt-4 text-xs leading-relaxed text-dim">
        <p>
          A day&apos;s read is its most conservative hour inside the demo
          window, daylight (sunrise–sunset) ∩ 8am–5pm.
        </p>
        <p>
          No-go thresholds: wind &gt; 20 kn · waves &gt; 4 ft · rain (esp. for
          optics) · visibility &lt; 2 mi. Weather &amp; marine data from{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Open-Meteo
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
