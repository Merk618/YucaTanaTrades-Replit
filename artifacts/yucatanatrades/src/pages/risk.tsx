import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { useMarketQuotes, isQuoteUsable, freshnessLabel, useNow } from "@/hooks/use-market";
import { sleeveLabel } from "@/data/positions";
import { useListPositions } from "@workspace/api-client-react";
import { DemoBadge } from "@/components/demo-badge";
import { cn } from "@/lib/utils";
import { useRiskConfig } from "@/hooks/use-risk-config";

const FRESHNESS_WARNING_MS = 15 * 60 * 1000;

// Estimated metrics that cannot be derived from spot quotes alone
const ESTIMATED_METRICS = [
  { label: "Portfolio Beta",       status: "warn", note: "Elevated vs S&P 500",   value: "1.42" },
  { label: "Max Drawdown (YTD)",   status: "ok",   note: "Within 15% limit",      value: "-8.4%" },
  { label: "Margin Usage",         status: "ok",   note: "No leverage used",       value: "0%" },
];

const ALERTS = [
  { severity: "warn", title: "NVDA Oversized",     msg: "NVDA is above 15% threshold — consider trimming if price > $950", date: "Jun 7" },
  { severity: "info", title: "Fed Meeting Impact",  msg: "Rate decision on Jun 12 — high volatility expected in rate-sensitive names", date: "Jun 6" },
  { severity: "warn", title: "BTC Funding Rate",    msg: "Positive funding rate on BTC perpetuals — crowded long trade risk", date: "Jun 5" },
  { severity: "ok",   title: "Margin Clear",        msg: "No margin in use across all accounts", date: "Jun 4" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  return <TrendingDown className="w-4 h-4 text-red-400" />;
}

export default function Risk() {
  const { config: riskConfig } = useRiskConfig();

  const { data: positionsData } = useListPositions();
  const positions = positionsData ?? [];
  const positionSymbols = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { data: quotesData } = useMarketQuotes(positionSymbols, 60_000);

  // ── Compute real allocations from live quotes × shares ──────────────────────
  const { holdings, totalValue, cryptoValue, positionSizing } = useMemo(() => {
    const quoteMap = new Map(
      (quotesData?.quotes ?? []).map((q) => [q.symbol, q]),
    );
    const enriched = positions.map((pos) => {
      const q = quoteMap.get(pos.ticker);
      const price = q && isQuoteUsable(q) ? q.price : 0;
      const displaySleeve = sleeveLabel(pos.sleeve);
      return { ...pos, sleeve: displaySleeve, price, value: price * pos.shares };
    });
    const total = enriched.reduce((s, h) => s + h.value, 0);
    const crypto = enriched
      .filter((h) => h.sleeve === "Crypto")
      .reduce((s, h) => s + h.value, 0);

    const sizing = enriched
      .filter((h) => h.value > 0 && total > 0)
      .map((h) => {
        const pct = (h.value / total) * 100;
        const limit = h.sleeve === "Crypto"
          ? riskConfig.cryptoPositionLimit
          : riskConfig.singlePositionLimit;
        return {
          ticker: h.ticker,
          allocation: pct,
          limit,
          risk: pct > riskConfig.singlePositionLimit ? "HIGH" : pct > 8 ? "OK" : "LOW",
        };
      })
      .sort((a, b) => b.allocation - a.allocation)
      .slice(0, 8);

    return { holdings: enriched, totalValue: total, cryptoValue: crypto, positionSizing: sizing };
  }, [quotesData, positions, riskConfig]);

  const hasRealData = totalValue > 0;
  const cryptoPct   = hasRealData ? (cryptoValue / totalValue) * 100 : 0;

  // ── Largest single-name concentration ───────────────────────────────────────
  const topPosition = positionSizing[0];
  const singleNameConc = topPosition ? topPosition.allocation : 0;
  const singleNameStatus = singleNameConc > riskConfig.singlePositionLimit ? "warn" : "ok";

  // ── Computed metrics (from real quotes) ─────────────────────────────────────
  const computedMetrics = hasRealData ? [
    {
      label: "Crypto Allocation",
      value: `${cryptoPct.toFixed(1)}%`,
      status: cryptoPct > riskConfig.cryptoAllocationLimit ? "warn" : "ok",
      note: cryptoPct > riskConfig.cryptoAllocationLimit
        ? `Exceeds ${riskConfig.cryptoAllocationLimit}% limit`
        : `Below ${riskConfig.cryptoAllocationLimit}% limit`,
      isReal: true,
    },
    {
      label: "Single-Name Concentration",
      value: singleNameConc > 0 ? `${singleNameConc.toFixed(1)}%` : "—",
      status: singleNameStatus,
      note: topPosition
        ? `${topPosition.ticker} ${singleNameConc > riskConfig.singlePositionLimit ? `> ${riskConfig.singlePositionLimit}% threshold` : "within limit"}`
        : "Computing…",
      isReal: true,
    },
  ] : [
    { label: "Crypto Allocation",         value: "—", status: "ok",   note: "Loading…", isReal: false },
    { label: "Single-Name Concentration", value: "—", status: "ok",   note: "Loading…", isReal: false },
  ];

  const allMetrics = [
    ...ESTIMATED_METRICS.map((m) => ({ ...m, isReal: false })),
    ...computedMetrics,
  ];

  // ── Sector concentration ─────────────────────────────────────────────────────
  const sectorMap = holdings.reduce<Record<string, number>>((acc, h) => {
    if (h.value > 0) acc[h.sector] = (acc[h.sector] ?? 0) + h.value;
    return acc;
  }, {});
  const techSemisPct = hasRealData
    ? (((sectorMap["Semis"] ?? 0) + (sectorMap["Tech"] ?? 0)) / totalValue) * 100
    : 0;

  const sectorMetric = {
    label: "Sector Concentration",
    value: hasRealData ? `${techSemisPct.toFixed(0)}%` : "—",
    status: techSemisPct > riskConfig.sectorConcentrationLimit ? "warn" : "ok",
    note: "Tech/Semis combined",
    isReal: hasRealData,
  };

  const metricsForDisplay = [...allMetrics, sectorMetric];
  const warningCount = metricsForDisplay.filter((m) => m.status !== "ok").length;
  const overallStatus = warningCount === 0 ? "ok" : warningCount <= 2 ? "moderate" : "high";

  // Simple risk score: 50 baseline + penalty for each warning
  const riskScore = Math.min(
    100,
    50
      + warningCount * 8
      + (singleNameConc > riskConfig.singlePositionLimit * 1.2 ? 4 : 0)
      + (cryptoPct > riskConfig.cryptoAllocationLimit * 0.75 ? 3 : 0),
  );

  const sourceLabel = quotesData?.quotes.find((q) => isQuoteUsable(q))?.sourceLabel ?? null;

  const now = useNow();

  const oldestTimestamp = useMemo(() => {
    const ts = (quotesData?.quotes ?? [])
      .filter(isQuoteUsable)
      .map((q) => q.timestamp)
      .filter((t): t is string => !!t)
      .map((t) => new Date(t).getTime())
      .filter((n) => !Number.isNaN(n));
    if (ts.length === 0) return undefined;
    return new Date(Math.min(...ts)).toISOString();
  }, [quotesData]);

  const isDataStale = useMemo(() => {
    if (!oldestTimestamp) return false;
    return now - new Date(oldestTimestamp).getTime() > FRESHNESS_WARNING_MS;
  }, [oldestTimestamp, now]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Risk Manager</h1>
          {sourceLabel && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {sourceLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          Allocations computed from real market prices · Beta and drawdown are estimated
        </p>
      </motion.div>

      {/* Freshness warning banner */}
      <AnimatePresence>
        {isDataStale && oldestTimestamp && (
          <motion.div
            key="freshness-banner"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: undefined }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-amber-300">
                  Markets may be closed —{" "}
                </span>
                <span className="text-sm text-amber-300/80">
                  prices last updated{" "}
                  <span className="font-mono font-semibold">{freshnessLabel(oldestTimestamp, now)}</span>.
                  Risk metrics may not reflect current market conditions.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall risk banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={cn("glass-card p-5 border-l-4", {
          "border-l-emerald-500": overallStatus === "ok",
          "border-l-orange-400": overallStatus === "moderate",
          "border-l-red-500":    overallStatus === "high",
        })}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Overall Risk Level</p>
            <p className={cn("text-2xl font-display font-bold capitalize", {
              "text-emerald-400": overallStatus === "ok",
              "text-orange-400": overallStatus === "moderate",
              "text-red-400":    overallStatus === "high",
            })}>
              {overallStatus === "moderate" ? "Moderate Risk" : overallStatus === "ok" ? "Low Risk" : "High Risk"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {warningCount} metric{warningCount !== 1 ? "s" : ""} outside target thresholds
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
            <p className="font-mono text-4xl font-bold text-foreground">
              {riskScore}<span className="text-xl text-muted-foreground">/100</span>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${riskScore}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-400 to-red-500"
              style={{ backgroundSize: "300% 100%", backgroundPosition: `${100 - riskScore}% 0` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Low</span><span>Moderate</span><span>High</span>
          </div>
        </div>
      </motion.div>

      {/* Risk metrics grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricsForDisplay.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                {!metric.isReal && <DemoBadge label="Est." />}
              </div>
              <StatusIcon status={metric.status} />
            </div>
            <p className={cn("font-mono text-xl font-bold", metric.status === "ok" ? "text-foreground" : metric.status === "warn" ? "text-orange-400" : "text-red-400")}>
              {metric.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{metric.note}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-12 md:col-span-7 glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-sm font-display font-semibold text-primary">Risk Alerts</h2>
          </div>
          <div className="divide-y divide-border/30">
            {ALERTS.map((alert, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className={cn("w-2 mt-1.5 h-2 rounded-full flex-shrink-0", {
                  "bg-orange-400": alert.severity === "warn",
                  "bg-blue-400":   alert.severity === "info",
                  "bg-emerald-400":alert.severity === "ok",
                })} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{alert.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Position sizing */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="col-span-12 md:col-span-5 glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-sm font-display font-semibold text-primary">Position Sizing</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {hasRealData ? `vs max allocation · ${sourceLabel ?? "market data"}` : "vs max allocation targets"}
            </p>
          </div>
          <div className="p-4 space-y-3">
            {positionSizing.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Loading positions…</p>
            )}
            {positionSizing.map((pos, i) => (
              <div key={pos.ticker}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{pos.ticker}</span>
                    {pos.allocation > pos.limit && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">OVER</span>
                    )}
                  </div>
                  <span className={cn("font-mono text-xs font-semibold", pos.allocation > pos.limit ? "text-orange-400" : "text-foreground")}>
                    {pos.allocation.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((pos.allocation / pos.limit) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.06 }}
                    className={cn("h-full rounded-full", pos.allocation > pos.limit ? "bg-orange-400" : "bg-primary")}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">Limit: {pos.limit}%</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
