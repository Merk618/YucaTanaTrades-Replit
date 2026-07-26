import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  CircleDot,
  DatabaseZap,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { motionTokens, panelReveal, useAppReducedMotion } from "@/lib/motion";

const concentration = [
  { label: "Technology", value: 32.4, tone: "is-gold" },
  { label: "Consumer", value: 18.6, tone: "is-cyan" },
  { label: "Financials", value: 14.1, tone: "is-green" },
] as const;

const regimePhases = [
  { label: "Prior", value: "Neutral", active: false },
  { label: "Current", value: "Expansion", active: true },
  { label: "Risk lens", value: "Moderate", active: false },
] as const;

const provenanceRows = [
  { label: "Market structure", value: "Historical fixture", tone: "historical" },
  { label: "Portfolio lens", value: "Deterministic demo", tone: "demo" },
  { label: "Catalyst calendar", value: "Provider unavailable", tone: "unavailable" },
] as const;

export function OverviewIntelligenceBand() {
  const reducedMotion = useAppReducedMotion();
  const [focus, setFocus] = React.useState<"market" | "portfolio">("market");

  return (
    <motion.section
      className="yt-overview-band"
      aria-labelledby="yt-overview-intelligence-title"
      initial={reducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={panelReveal}
    >
      <header className="yt-overview-band-heading">
        <div>
          <span>Decision context</span>
          <h2 id="yt-overview-intelligence-title">Session intelligence</h2>
        </div>
        <div className="yt-overview-focus" role="group" aria-label="Intelligence focus">
          {(["market", "portfolio"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={focus === option ? "is-active" : undefined}
              aria-pressed={focus === option}
              onClick={() => setFocus(option)}
            >
              {focus === option && (
                <motion.span
                  layoutId="yt-overview-focus"
                  transition={reducedMotion ? { duration: 0 } : motionTokens.spring.snappy}
                />
              )}
              <b>{option === "market" ? "Market" : "Portfolio"}</b>
            </button>
          ))}
        </div>
        <span className="yt-state-pill is-demo">Demo · Fixed</span>
      </header>

      <div className="yt-overview-band-grid">
        <article className="yt-overview-module is-regime">
          <div className="yt-overview-module-title">
            <Activity aria-hidden="true" />
            <span><strong>Regime timeline</strong><small>Derived from fixed UI-2 inputs</small></span>
          </div>
          <div className="yt-regime-track" aria-label="Regime timeline demonstration">
            {regimePhases.map((phase) => (
              <div key={phase.label} className={phase.active ? "is-active" : undefined}>
                <CircleDot aria-hidden="true" />
                <span>{phase.label}<strong>{phase.value}</strong></span>
              </div>
            ))}
          </div>
          <p>
            <strong>Next actions · </strong>
            {focus === "market"
              ? "Review breadth beside the fixed benchmark before opening Markets."
              : "Review concentration and provider boundaries before opening Portfolio."}
          </p>
        </article>

        <article className="yt-overview-module is-concentration">
          <div className="yt-overview-module-title">
            <Layers3 aria-hidden="true" />
            <span><strong>Concentration lens</strong><small>Portfolio fixture · not an account</small></span>
          </div>
          <div className="yt-concentration-summary">
            <span><strong>41.8%</strong><small>Top three positions</small></span>
            <span className="yt-state-pill is-demo">Demo</span>
          </div>
          <div className="yt-concentration-bars">
            {concentration.map((item) => (
              <div key={item.label}>
                <span>{item.label}<b>{item.value.toFixed(1)}%</b></span>
                <i><motion.em className={item.tone} initial={false} animate={{ width: `${item.value * 2.45}%` }} transition={reducedMotion ? { duration: 0 } : { duration: motionTokens.duration.panel, ease: motionTokens.ease.out }} /></i>
              </div>
            ))}
          </div>
        </article>

        <article className="yt-overview-module is-catalysts">
          <div className="yt-overview-module-title">
            <CalendarClock aria-hidden="true" />
            <span><strong>Upcoming catalysts</strong><small>Source and freshness reserved</small></span>
          </div>
          <div className="yt-catalyst-empty">
            <DatabaseZap aria-hidden="true" />
            <span><strong>Calendar provider unavailable</strong><small>No events or times have been invented.</small></span>
          </div>
          <div className="yt-catalyst-taxonomy" aria-label="Deferred catalyst categories">
            <span>Macro</span><span>Earnings</span><span>Rates</span>
          </div>
        </article>

        <article className="yt-overview-module is-provenance">
          <div className="yt-overview-module-title">
            <ShieldCheck aria-hidden="true" />
            <span><strong>Truth &amp; provenance</strong><small>Review state across this workspace</small></span>
          </div>
          <dl>
            {provenanceRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd><span className={`yt-state-pill is-${row.tone}`}>{row.value}</span></dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </motion.section>
  );
}
