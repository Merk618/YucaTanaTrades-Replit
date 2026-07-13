import type { DataTruthState } from "@/contracts/dashboard";

const defaultLabels: Record<DataTruthState, string> = {
  live: "Live",
  delayed: "Delayed",
  historical: "Historical",
  demo: "Demo",
  simulated: "Simulated",
  "ai-generated": "AI-generated",
  unavailable: "Unavailable",
};

export function TruthBadge({
  state,
  label,
  provider,
  delayedMinutes,
  compact = false,
  className = "",
  title,
}: {
  state: DataTruthState;
  label?: string;
  provider?: string;
  delayedMinutes?: number;
  compact?: boolean;
  className?: string;
  title?: string;
}) {
  const stateClass =
    state === "demo" || state === "simulated"
      ? "is-demo"
      : state === "historical" || state === "delayed"
        ? "is-historical"
        : state === "ai-generated"
          ? "is-ai"
          : state === "unavailable"
            ? "is-unavailable"
            : "";

  return (
    <span
      className={`yt-state-pill yt-truth-badge ${stateClass} ${compact ? "is-compact" : ""} ${className}`.trim()}
      title={title ?? provider}
      data-truth-state={state}
    >
      <span className="yt-truth-badge__label">{label ?? defaultLabels[state]}</span>
      {state === "delayed" && delayedMinutes ? (
        <span className="yt-truth-badge__delay"> · {delayedMinutes} min</span>
      ) : null}
      {!compact && provider ? <span className="yt-truth-badge__provider"> · {provider}</span> : null}
    </span>
  );
}
