import { formatRelativeAge } from "@/lib/ui/format";

/**
 * Shown when the live fetch failed and we're serving the last cached forecast.
 * States plainly what the viewer is looking at and how old it is, and offers a
 * retry — no apology, just direction.
 */
export function OfflineBanner({
  fetchedAt,
  onRetry,
}: {
  fetchedAt: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-caution/50 bg-caution/10 px-4 py-2.5 text-sm text-caution"
    >
      <span>
        Offline — showing the last forecast from {formatRelativeAge(fetchedAt)}.
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-caution/50 px-2.5 py-1 text-xs uppercase tracking-wide hover:bg-caution/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-caution"
      >
        Retry
      </button>
    </div>
  );
}
