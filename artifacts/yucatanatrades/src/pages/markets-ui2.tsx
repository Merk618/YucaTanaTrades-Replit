import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bitcoin,
  Clock3,
  Coins,
  Gauge,
  Landmark,
  Layers3,
  RadioTower,
  TrendingUp,
} from "lucide-react";
import { MarketChart } from "@/components/ui1/market-chart";
import { dashboardDemo } from "@/data/ui1-demo";
import { panelReveal, staggerContainer, useAppReducedMotion } from "@/lib/motion";
import {
  Delta,
  MarketPanelHeading,
  MarketRouteHeading,
  MarketSparkline,
  TruthLabel,
} from "@/pages/market-route-primitives";
import { previewChartData } from "@/pages/preview-route";

const indexFallback = {
  id: "rut",
  symbol: "RUT",
  label: "RUSSELL 2000",
  displayValue: "2,026.51",
  changePercent: -0.22,
  direction: "down" as const,
  sparkline: [46, 44, 45, 43, 41, 42, 39, 40, 38, 39, 37, 38],
};

const rates = [
  { label: "US 2Y", value: "4.630%", change: "+1.8 bp" },
  { label: "US 10Y", value: "4.283%", change: "−0.1 bp" },
  { label: "US 30Y", value: "4.428%", change: "+0.7 bp" },
];

const commodities = [
  { label: "Gold", symbol: "GC", value: "$2,371.10", change: 0.34 },
  { label: "WTI Crude", symbol: "CL", value: "$82.21", change: -0.46 },
  { label: "Copper", symbol: "HG", value: "$4.51", change: 0.18 },
];

const crypto = [
  { label: "Bitcoin", symbol: "BTC", value: "$58,421", change: 1.14 },
  { label: "Ethereum", symbol: "ETH", value: "$3,112", change: 0.82 },
  { label: "Solana", symbol: "SOL", value: "$142.60", change: -0.27 },
];

function IndexOverview() {
  const indices = [...dashboardDemo.marketStrip.items.slice(0, 3), indexFallback];

  return (
    <motion.section className="yt-ui2-panel yt-ui2-index-overview" variants={panelReveal} aria-label="Historical demo index overview">
      <MarketPanelHeading
        icon={TrendingUp}
        title="Index overview"
        detail="Fixed close snapshot · Jul 10, 2026 · 4:00 PM ET"
        state="Historical · Demo"
        tone="historical"
      />
      <div className="yt-ui2-index-grid">
        {indices.map((item) => (
          <article key={item.id} className="yt-ui2-index-card">
            <div className="yt-ui2-index-card__identity">
              <span>{item.label}</span>
              <small>{item.symbol}</small>
            </div>
            <div className="yt-ui2-index-card__quote">
              <strong>{item.displayValue}</strong>
              <Delta value={item.changePercent} />
            </div>
            <MarketSparkline
              values={item.sparkline}
              tone={item.changePercent >= 0 ? "positive" : "negative"}
            />
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function SessionPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-session-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Clock3}
        title="Session status"
        detail="New York cash session"
        state="Demo"
        tone="demo"
      />
      <div className="yt-ui2-session-hero">
        <span className="yt-ui2-session-orbit" aria-hidden="true"><i /></span>
        <div>
          <span>Cash market</span>
          <strong>Closed</strong>
          <small>Fixed at 4:00 PM ET</small>
        </div>
      </div>
      <dl className="yt-ui2-definition-list">
        <div><dt>Extended hours</dt><dd>Not represented</dd></div>
        <div><dt>Futures feed</dt><dd className="is-muted">Unavailable</dd></div>
        <div><dt>Streaming quotes</dt><dd className="is-muted">Unavailable</dd></div>
      </dl>
      <p className="yt-ui2-panel-note"><RadioTower aria-hidden="true" />No provider or exchange connection is active.</p>
    </motion.article>
  );
}

function VolatilityPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-volatility-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Gauge}
        title="Volatility"
        detail="Fixed historical structure"
        state="Historical"
        tone="historical"
      />
      <div className="yt-ui2-volatility-quote">
        <div><span>VIX</span><strong>12.45</strong></div>
        <Delta value={-1.85} />
      </div>
      <div className="yt-ui2-range" aria-label="VIX demo range position 28 percent">
        <span style={{ width: "28%" }} />
      </div>
      <div className="yt-ui2-range-labels"><span>10.82</span><span>20-day demo range</span><span>18.61</span></div>
      <dl className="yt-ui2-definition-list is-compact">
        <div><dt>Term structure</dt><dd>Contango · Demo</dd></div>
        <div><dt>Risk regime</dt><dd className="is-positive">Contained · Demo</dd></div>
      </dl>
    </motion.article>
  );
}

function SectorPanel() {
  const cells = dashboardDemo.heatmap.cells;
  return (
    <motion.article className="yt-ui2-panel yt-ui2-sector-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Layers3}
        title="Sector leadership"
        detail="S&P sector change sample"
        state="Demo"
        tone="demo"
      />
      <div className="yt-ui2-sector-list">
        {cells.slice(0, 7).map((cell, index) => (
          <div key={cell.id} className="yt-ui2-sector-row">
            <span className="yt-ui2-rank">{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{cell.sector}</strong><span><i style={{ width: `${Math.max(12, Math.abs(cell.changePercent) / 1.28 * 100)}%` }} /></span></div>
            <Delta value={cell.changePercent} />
          </div>
        ))}
      </div>
    </motion.article>
  );
}

function BreadthPanel() {
  const breadth = dashboardDemo.breadth;
  return (
    <motion.article className="yt-ui2-panel yt-ui2-breadth-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Activity}
        title="Market breadth"
        detail="Fixed distribution"
        state="Demo"
        tone="demo"
      />
      <div className="yt-ui2-breadth-body">
        <div className="yt-ui2-breadth-ring" aria-label={`${breadth.advancingPercent}% advancing, ${breadth.decliningPercent}% declining, ${breadth.unchangedPercent}% unchanged`}>
          <div><strong>{breadth.advancingPercent}%</strong><span>advancing</span></div>
        </div>
        <dl className="yt-ui2-breadth-stats">
          <div><dt><i className="is-up" />Advancing</dt><dd>{breadth.advancingPercent}%</dd></div>
          <div><dt><i className="is-down" />Declining</dt><dd>{breadth.decliningPercent}%</dd></div>
          <div><dt><i className="is-flat" />Unchanged</dt><dd>{breadth.unchangedPercent}%</dd></div>
        </dl>
      </div>
      <p className="yt-ui2-panel-note">No constituent-level breadth feed is connected.</p>
    </motion.article>
  );
}

function RatesPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-list-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Landmark}
        title="Rates"
        detail="Synthetic delayed-state fixture"
        state="Delayed-state Demo"
        tone="delayed"
      />
      <div className="yt-ui2-instrument-list">
        {rates.map((item) => (
          <div key={item.label}>
            <span><strong>{item.label}</strong><small>Treasury yield</small></span>
            <span><b>{item.value}</b><small>{item.change}</small></span>
          </div>
        ))}
      </div>
      <p className="yt-ui2-panel-note">Demonstrates delayed labeling; values are fixed.</p>
    </motion.article>
  );
}

function CommoditiesPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-list-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Coins}
        title="Commodities"
        detail="Reference close sample"
        state="Historical · Demo"
        tone="historical"
      />
      <div className="yt-ui2-instrument-list">
        {commodities.map((item) => (
          <div key={item.symbol}>
            <span><strong>{item.label}</strong><small>{item.symbol} · fixed</small></span>
            <span><b>{item.value}</b><Delta value={item.change} /></span>
          </div>
        ))}
      </div>
      <p className="yt-ui2-panel-note">Historical UI fixture · no futures provider.</p>
    </motion.article>
  );
}

function CryptoPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-list-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Bitcoin}
        title="Digital assets"
        detail="Synthetic delayed-state fixture"
        state="Delayed-state Demo"
        tone="delayed"
      />
      <div className="yt-ui2-instrument-list">
        {crypto.map((item) => (
          <div key={item.symbol}>
            <span><strong>{item.label}</strong><small>{item.symbol} · fixed</small></span>
            <span><b>{item.value}</b><Delta value={item.change} /></span>
          </div>
        ))}
      </div>
      <p className="yt-ui2-panel-note">No exchange, wallet, or custody connection.</p>
    </motion.article>
  );
}

export function MarketsRoute() {
  const reducedMotion = useAppReducedMotion();

  return (
    <motion.div
      className="yt-ui2-route yt-ui2-markets-route"
      variants={staggerContainer}
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div variants={panelReveal}>
        <MarketRouteHeading
          eyebrow="Global market lens · UI-2"
          title="Markets"
          description="A calm analytical overview built from deterministic fixtures. No live quote, news, exchange, broker, or provider request is made."
          state="Historical · Demo"
        />
      </motion.div>

      <IndexOverview />

      <div className="yt-ui2-market-focus-grid">
        <motion.div className="yt-ui2-market-chart" variants={panelReveal}>
          <div className="yt-ui2-chart-context">
            <span><BarChart3 aria-hidden="true" />Primary benchmark</span>
            <span>Fixed historical candles</span>
            <TruthLabel tone="historical">Historical · Demo</TruthLabel>
          </div>
          <MarketChart data={previewChartData} routeMode />
        </motion.div>
        <div className="yt-ui2-market-sidecar">
          <SessionPanel />
          <VolatilityPanel />
        </div>
      </div>

      <div className="yt-ui2-market-analytics-grid">
        <SectorPanel />
        <BreadthPanel />
        <RatesPanel />
        <CommoditiesPanel />
        <CryptoPanel />
      </div>
    </motion.div>
  );
}
