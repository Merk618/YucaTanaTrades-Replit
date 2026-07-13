import { motion, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, CircleDollarSign, WalletCards } from "lucide-react";
import type { PortfolioSummary } from "@/contracts/dashboard";
import { useCountUp } from "@/hooks/use-count-up";
import { motionTokens } from "@/lib/motion";
import { TruthBadge } from "@/components/ui1/truth-badge";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PortfolioSparkline({ values, reducedMotion }: { values: number[]; reducedMotion: boolean }) {
  const width = 126;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / range) * 31 - 4;
    return [x, y] as const;
  });
  const path = points.map(([x, y], index) => `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="yt-portfolio-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#77b77a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#77b77a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#yt-portfolio-area)" />
      <motion.path
        d={path}
        fill="none"
        stroke="#83bf86"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: motionTokens.ease.out, delay: motionTokens.delay.portfolioLine }}
      />
    </svg>
  );
}

export function PortfolioBand({ data }: { data: PortfolioSummary }) {
  const reducedMotion = Boolean(useReducedMotion());
  const animatedTotal = useCountUp(Math.round(data.totalValue * 100), 900, true) / 100;
  const animatedPnl = useCountUp(Math.round(Math.abs(data.unrealizedPnl) * 100), 760, true) / 100;
  const animatedBuyingPower = useCountUp(Math.round(data.buyingPower * 100), 820, true) / 100;

  return (
    <motion.section
      className="yt-portfolio-band"
      aria-labelledby="yt-portfolio-title"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.portfolio }}
    >
      <div className="yt-portfolio-total">
        <div className="yt-portfolio-label">
          <BriefcaseBusiness aria-hidden="true" />
          <span id="yt-portfolio-title">Portfolio value</span>
          <TruthBadge state={data.dataState} label="Demo" compact title={data.statusMessage} />
        </div>
        <div className="yt-portfolio-value">
          <strong>{money(animatedTotal)}</strong>
          <span className={data.dayChangePercent >= 0 ? "is-positive" : "is-negative"}>
            {data.dayChangePercent >= 0 ? "+" : ""}{data.dayChangePercent.toFixed(2)}% today
          </span>
        </div>
      </div>

      <div className="yt-portfolio-sparkline">
        <PortfolioSparkline values={data.sparkline} reducedMotion={reducedMotion} />
        <span>Deterministic fixture</span>
      </div>

      <dl className="yt-portfolio-metrics">
        <div className="yt-portfolio-metric">
          <dt><CircleDollarSign aria-hidden="true" />Unrealized P&amp;L</dt>
          <dd className={data.unrealizedPnl >= 0 ? "is-positive" : "is-negative"}>
            {data.unrealizedPnl >= 0 ? "+" : "-"}{money(animatedPnl)}
          </dd>
        </div>
        <div className="yt-portfolio-metric">
          <dt><WalletCards aria-hidden="true" />Buying power</dt>
          <dd>{money(animatedBuyingPower)}</dd>
        </div>
        <div className="yt-portfolio-metric is-compact">
          <div><dt>Day change</dt><dd className={data.dayChange >= 0 ? "is-positive" : "is-negative"}>{data.dayChange >= 0 ? "+" : ""}{money(data.dayChange)}</dd></div>
          <div><dt>Cash balance</dt><dd>{money(data.cashBalance)}</dd></div>
        </div>
        <div className="yt-portfolio-metric is-position-count">
          <dt>Positions</dt>
          <dd>{data.positionsCount}</dd>
        </div>
      </dl>
    </motion.section>
  );
}
