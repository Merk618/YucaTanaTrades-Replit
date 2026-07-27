import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Grid2X2, ListFilter, PieChart } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export interface BreadthView {
  advancing: number;
  declining: number;
  unchanged: number;
  stateLabel: string;
}

export interface HeatmapCellView {
  sector: string;
  changePercent: number;
  weight: number;
}

export interface WatchlistItemView {
  symbol: string;
  company: string;
  price: string;
  changePercent: number;
}

export function SupportingAnalytics({
  breadth,
  heatmap,
  watchlist,
}: {
  breadth: BreadthView;
  heatmap: HeatmapCellView[];
  watchlist: { stateLabel: string; items: WatchlistItemView[] };
}) {
  const [selectedSector, setSelectedSector] = React.useState(heatmap[0]?.sector ?? "");
  const [selectedSymbol, setSelectedSymbol] = React.useState(watchlist.items[0]?.symbol ?? "");
  const reducedMotion = useReducedMotion();
  const selectedHeatmap = heatmap.find((item) => item.sector === selectedSector);

  return (
    <section className="yt-supporting-analytics" aria-label="Supporting market analytics">
      <motion.article
        className="yt-analytics-panel yt-breadth-panel"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.supporting }}
      >
        <header className="yt-panel-heading">
          <div><PieChart aria-hidden="true" /><h2>Market Breadth</h2></div>
          <span className="yt-state-pill is-demo">{breadth.stateLabel}</span>
        </header>
        <div className="yt-breadth-body">
          <div
            className="yt-breadth-donut"
            role="img"
            aria-label={`${breadth.advancing}% advancing, ${breadth.declining}% declining, ${breadth.unchanged}% unchanged, demo data`}
            style={{ transform: "none" }}
          >
            <svg
              className="yt-breadth-ring"
              viewBox="0 0 104 104"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                className="yt-breadth-ring-track"
                cx="52"
                cy="52"
                r="44"
                fill="none"
                stroke="rgba(131, 147, 154, 0.18)"
                strokeWidth="15"
              />
              <g className="yt-breadth-ring-arcs" transform="rotate(-90 52 52)">
                <circle
                  className="yt-breadth-arc is-positive"
                  cx="52"
                  cy="52"
                  r="44"
                  pathLength="100"
                  fill="none"
                  stroke="var(--yt-positive)"
                  strokeWidth="15"
                  strokeDasharray={`${breadth.advancing} ${100 - breadth.advancing}`}
                />
                <circle
                  className="yt-breadth-arc is-negative"
                  cx="52"
                  cy="52"
                  r="44"
                  pathLength="100"
                  fill="none"
                  stroke="var(--yt-negative)"
                  strokeWidth="15"
                  strokeDasharray={`${breadth.declining} ${100 - breadth.declining}`}
                  strokeDashoffset={-breadth.advancing}
                />
                <circle
                  className="yt-breadth-arc is-flat"
                  cx="52"
                  cy="52"
                  r="44"
                  pathLength="100"
                  fill="none"
                  stroke="#83939a"
                  strokeWidth="15"
                  strokeDasharray={`${breadth.unchanged} ${100 - breadth.unchanged}`}
                  strokeDashoffset={-(breadth.advancing + breadth.declining)}
                />
              </g>
            </svg>
            <span className="yt-breadth-center" aria-hidden="true" style={{ transform: "none" }}>
              <strong>{breadth.advancing}%</strong>
              <small>advancing</small>
            </span>
          </div>
          <dl className="yt-breadth-legend">
            <div><dt><i className="is-positive" />Advancing</dt><dd>{breadth.advancing}%</dd></div>
            <div><dt><i className="is-negative" />Declining</dt><dd>{breadth.declining}%</dd></div>
            <div><dt><i className="is-flat" />Unchanged</dt><dd>{breadth.unchanged}%</dd></div>
          </dl>
        </div>
      </motion.article>

      <motion.article
        className="yt-analytics-panel yt-heatmap-panel"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.supporting + motionTokens.stagger.compact }}
      >
        <header className="yt-panel-heading">
          <div><Grid2X2 aria-hidden="true" /><h2>Market Heatmap</h2></div>
          <div className="yt-panel-state-group">
            {selectedHeatmap && <span className={selectedHeatmap.changePercent >= 0 ? "is-positive" : "is-negative"}>
              {selectedHeatmap.sector} {selectedHeatmap.changePercent >= 0 ? "+" : ""}{selectedHeatmap.changePercent.toFixed(2)}%
            </span>}
            <span className="yt-state-pill is-demo">Demo</span>
          </div>
        </header>
        <div className="yt-heatmap-grid" role="list" aria-label="Demo sector performance">
          {heatmap.map((cell) => {
            const positive = cell.changePercent >= 0;
            const selected = selectedSector === cell.sector;
            const intensity = Math.min(0.42, 0.12 + Math.abs(cell.changePercent) * 0.16);
            return (
              <motion.button
                key={cell.sector}
                type="button"
                role="listitem"
                className={`${positive ? "is-positive" : "is-negative"} ${selected ? "is-selected" : ""}`}
                style={{
                  flexGrow: Math.max(0.75, cell.weight),
                  background: positive
                    ? `linear-gradient(145deg, rgba(83, 143, 101, ${intensity}), rgba(39, 89, 71, ${intensity * 0.7}))`
                    : `linear-gradient(145deg, rgba(164, 73, 64, ${intensity}), rgba(101, 50, 52, ${intensity * 0.7}))`,
                }}
                aria-pressed={selected}
                onClick={() => setSelectedSector(cell.sector)}
                whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                transition={motionTokens.spring.snappy}
              >
                <span>{cell.sector}</span>
                <strong>{positive ? "+" : ""}{cell.changePercent.toFixed(2)}%</strong>
              </motion.button>
            );
          })}
        </div>
      </motion.article>

      <motion.article
        className="yt-analytics-panel yt-watchlist-panel"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.supporting + motionTokens.stagger.compact * 2 }}
      >
        <header className="yt-panel-heading">
          <div><ListFilter aria-hidden="true" /><h2>Watchlist</h2></div>
          <span className="yt-state-pill is-demo">{watchlist.stateLabel}</span>
        </header>
        <div className="yt-watchlist-table" role="listbox" aria-label="Demo watchlist">
          {watchlist.items.slice(0, 4).map((item, index) => {
            const positive = item.changePercent >= 0;
            const selected = selectedSymbol === item.symbol;
            return (
              <button
                key={item.symbol}
                type="button"
                role="option"
                aria-selected={selected}
                className={selected ? "is-selected" : undefined}
                onClick={() => setSelectedSymbol(item.symbol)}
              >
                {selected && (
                  <motion.span
                    className="yt-watchlist-selection"
                    layoutId="yt-watchlist-selection"
                    transition={motionTokens.spring.snappy}
                  />
                )}
                <span className="yt-watchlist-logo" aria-hidden="true">{item.symbol.slice(0, 1)}</span>
                <span className="yt-watchlist-name"><strong>{item.symbol}</strong><small>{item.company}</small></span>
                <span className={positive ? "is-positive" : "is-negative"}>
                  {positive ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
                  {positive ? "+" : ""}{item.changePercent.toFixed(2)}%
                </span>
                <span className="yt-watchlist-price">{item.price}</span>
                <span className="sr-only">Demo row {index + 1}</span>
              </button>
            );
          })}
        </div>
      </motion.article>
    </section>
  );
}
