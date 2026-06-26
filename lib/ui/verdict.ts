/**
 * Presentation mapping for verdicts — labels, colours, and the plain-language
 * phrasing shown to Tara. Keeps verdict styling in one place; never re-derives
 * thresholds (that lives in `scoring.ts`).
 */
import type { LimitingFactor, MetricKey, Verdict } from "@/lib/weather/types";

export const VERDICT_LABEL: Record<Verdict, string> = {
  GO: "GO",
  CAUTION: "CAUTION",
  NO_GO: "NO-GO",
};

/** Tailwind text-colour class per verdict. */
export const VERDICT_TEXT: Record<Verdict, string> = {
  GO: "text-go",
  CAUTION: "text-caution",
  NO_GO: "text-nogo",
};

/** Tailwind solid background (the signal-flag fill) per verdict. */
export const VERDICT_FILL: Record<Verdict, string> = {
  GO: "bg-go",
  CAUTION: "bg-caution",
  NO_GO: "bg-nogo",
};

const METRIC_NOUN: Record<MetricKey, string> = {
  wind: "wind",
  wave: "sea state",
  precip: "rain",
  visibility: "visibility",
};

/**
 * The headline read for a day, in Tara's terms. Frames the verdict as "do
 * conditions clear your limits?" — never as an instruction to cancel.
 */
export function verdictPhrase(
  verdict: Verdict,
  limiting: LimitingFactor | null,
): string {
  if (verdict === "GO") return "Conditions clear your limits";
  const noun = limiting ? METRIC_NOUN[limiting.metric] : "conditions";
  if (verdict === "CAUTION") return `Watch the ${noun}`;
  return `Past your limits on ${noun}`;
}
