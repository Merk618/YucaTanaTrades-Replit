import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type MarketTruthTone = "demo" | "historical" | "delayed" | "unavailable" | "ai";

export function TruthLabel({ tone, children }: { tone: MarketTruthTone; children: ReactNode }) {
  const stateClass = tone === "delayed" ? "is-historical" : tone === "ai" ? "is-ai" : `is-${tone}`;
  return <span className={`yt-state-pill ${stateClass} yt-ui2-truth-label`}>{children}</span>;
}

export function MarketRouteHeading({
  eyebrow,
  title,
  description,
  state,
  tone = "historical",
}: {
  eyebrow: string;
  title: string;
  description: string;
  state: string;
  tone?: MarketTruthTone;
}) {
  return (
    <header className="yt-ui2-route-heading">
      <div className="yt-ui2-route-heading__copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="yt-ui2-route-heading__state">
        <span>Provider-neutral workspace</span>
        <TruthLabel tone={tone}>{state}</TruthLabel>
      </div>
    </header>
  );
}

export function MarketPanelHeading({
  icon: Icon,
  title,
  detail,
  state,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  state: string;
  tone: MarketTruthTone;
}) {
  return (
    <header className="yt-ui2-panel-heading">
      <div>
        <span className="yt-ui2-panel-heading__icon"><Icon aria-hidden="true" /></span>
        <span>
          <h2>{title}</h2>
          {detail ? <small>{detail}</small> : null}
        </span>
      </div>
      <TruthLabel tone={tone}>{state}</TruthLabel>
    </header>
  );
}

export function MarketSparkline({ values, tone = "positive" }: { values: number[]; tone?: "positive" | "negative" | "neutral" }) {
  const width = 104;
  const height = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - 2 - ((value - min) / range) * (height - 5);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className={`yt-ui2-sparkline is-${tone}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Delta({ value }: { value: number }) {
  const tone = value > 0 ? "is-positive" : value < 0 ? "is-negative" : "is-neutral";
  return <span className={`yt-ui2-delta ${tone}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}
