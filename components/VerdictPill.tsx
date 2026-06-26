import type { Verdict } from "@/lib/weather/types";
import { VERDICT_FILL, VERDICT_LABEL, VERDICT_TEXT } from "@/lib/ui/verdict";

const SIZE = {
  sm: "text-xs px-2 py-0.5 gap-1.5",
  lg: "text-sm px-3 py-1 gap-2",
} as const;

/** A signal-flag dot + verdict label. The fast triage cue, never shown alone. */
export function VerdictPill({
  verdict,
  size = "sm",
}: {
  verdict: Verdict;
  size?: keyof typeof SIZE;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line/70 bg-deep/40 font-display font-semibold tracking-wide ${VERDICT_TEXT[verdict]} ${SIZE[size]}`}
    >
      <span className={`h-2 w-2 rounded-full ${VERDICT_FILL[verdict]}`} aria-hidden />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
