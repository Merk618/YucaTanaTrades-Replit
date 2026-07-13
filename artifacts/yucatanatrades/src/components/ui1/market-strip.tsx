import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export interface MarketStripItemView {
  label: string;
  symbol: string;
  value: string;
  changePercent: number;
  sparkline: number[];
}

function Sparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  const width = 102;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={positive ? "yt-strip-up" : "yt-strip-down"} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#77b77a" : "#f0644f"} stopOpacity="0.24" />
          <stop offset="100%" stopColor={positive ? "#77b77a" : "#f0644f"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${positive ? "yt-strip-up" : "yt-strip-down"})`} />
      <polyline points={points} fill="none" stroke={positive ? "#77b77a" : "#f0644f"} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function useCentralTime() {
  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    const update = () => setLabel(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return label;
}

export function MarketStrip({
  items,
  sessionLabel,
  stateLabel,
}: {
  items: MarketStripItemView[];
  sessionLabel: string;
  stateLabel: string;
}) {
  const reducedMotion = useReducedMotion();
  const clock = useCentralTime();

  return (
    <motion.section
      className="yt-market-strip"
      aria-label="Market reference strip"
      initial={reducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.strip }}
    >
      <div className="yt-market-strip-status">
        <span className="yt-state-pill is-demo">{stateLabel}</span>
        <span>{sessionLabel}</span>
        <span className="yt-strip-clock"><Clock3 aria-hidden="true" />{clock} CT</span>
      </div>
      <div className="yt-market-strip-items">
        {items.map((item) => {
          const positive = item.changePercent >= 0;
          return (
            <article key={item.symbol} className="yt-strip-item">
              <div className="yt-strip-copy">
                <small>{item.label}</small>
                <div>
                  <strong>{item.value}</strong>
                  <span className={positive ? "is-positive" : "is-negative"}>
                    {positive ? "+" : ""}{item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              <Sparkline values={item.sparkline} positive={positive} />
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
