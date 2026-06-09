import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Briefcase, ArrowUpRight, ArrowDownRight, BarChart2, AlertTriangle } from "lucide-react";
import { useMarketQuotes, isQuoteUsable, quoteBadge, freshnessLabel, useNow } from "@/hooks/use-market";
import { sleeveLabel } from "@/data/positions";
import { useListPositions } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

// ─── Deterministic performance history (90 trading days) ─────────────────────
// Chart shows a simulated historical walk — current values pin to real quotes
function generateHistory(finalTotals: { roth: number; indiv: number; crypto: number } | null) {
  let s = 1337;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  let roth = 118500;
  let indiv = 64200;
  let crypto = 23800;

  const origin = new Date("2026-06-07");
  const result: { date: string; total: number; rothIra: number; individual: number; crypto: number }[] = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(origin);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    roth   *= 1 + 0.00025 + (r() - 0.5) * 0.016;
    indiv  *= 1 + 0.00018 + (r() - 0.5) * 0.014;
    crypto *= 1 + 0.00040 + (r() - 0.5) * 0.046;

    roth   = Math.min(128000, Math.max(108000, roth));
    indiv  = Math.min(72000,  Math.max(58000,  indiv));
    crypto = Math.min(33000,  Math.max(16000,  crypto));

    result.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rothIra:    Math.round(roth),
      individual: Math.round(indiv),
      crypto:     Math.round(crypto),
      total:      Math.round(roth + indiv + crypto),
    });
  }

  // Pin last row to real current values if available, simulated fallback otherwise
  const last = result[result.length - 1];
  if (last) {
    if (finalTotals) {
      last.rothIra    = Math.round(finalTotals.roth);
      last.individual = Math.round(finalTotals.indiv);
      last.crypto     = Math.round(finalTotals.crypto);
      last.total      = Math.round(finalTotals.roth + finalTotals.indiv + finalTotals.crypto);
    } else {
      last.rothIra    = 125430;
      last.individual = 67890;
      last.crypto     = 28450;
      last.total      = 221770;
    }
  }
  return result;
}

const PERIOD_SLICES = { "1W": 5, "1M": 22, "3M": 65 } as const;
type Period = keyof typeof PERIOD_SLICES;

const FRESHNESS_WARNING_MS = 15 * 60 * 1000; // 15 minutes

// ─── Sleeve config ────────────────────────────────────────────────────────────
const SLEEVES = [
  { label: "Roth IRA",   key: "Roth IRA",   color: "bg-primary",       chartColor: "#C4A44A", icon: "🏛️" },
  { label: "Individual", key: "Individual", color: "bg-blue-500",      chartColor: "#3b82f6", icon: "💼" },
  { label: "Crypto",     key: "Crypto",     color: "bg-emerald-500",   chartColor: "#10b981", icon: "🪙" },
];

const SECTOR_COLORS: Record<string, string> = {
  Semis: "#C4A44A", Tech: "#3b82f6", Nuclear: "#f97316",
  Defense: "#8b5cf6", Crypto: "#10b981", Space: "#06b6d4",
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, view }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  view: "total" | "sleeves";
}) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="glass-card px-4 py-3 border-primary/30 shadow-xl shadow-black/40 text-xs min-w-[160px]">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">
              {p.name === "rothIra" ? "Roth IRA" : p.name === "individual" ? "Individual" : p.name === "crypto" ? "Crypto" : "Total"}
            </span>
          </div>
          <span className="font-mono font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sector donut ─────────────────────────────────────────────────────────────
function SectorAllocation({ holdings }: { holdings: { sector: string; value: number }[] }) {
  const sectors = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.sector] = (acc[h.sector] ?? 0) + h.value;
    return acc;
  }, {});
  const total = Object.values(sectors).reduce((s, v) => s + v, 0);

  let offset = 0;
  const slices = Object.entries(sectors).map(([sector, value]) => {
    const pct = total > 0 ? value / total : 0;
    const dasharray = `${pct * 100} ${100 - pct * 100}`;
    const slice = { sector, value, pct, dasharray, offset };
    offset += pct * 100;
    return slice;
  });

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Sector Allocation</h3>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(225 15% 12%)" strokeWidth="3" />
            {slices.map((s) => (
              <circle
                key={s.sector}
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={SECTOR_COLORS[s.sector] ?? "#888"}
                strokeWidth="3.5"
                strokeDasharray={s.dasharray}
                strokeDashoffset={-s.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] text-muted-foreground">Holdings</span>
            <span className="font-mono font-bold text-sm text-foreground">{holdings.length}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {slices.sort((a, b) => b.pct - a.pct).map((s) => (
            <div key={s.sector} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SECTOR_COLORS[s.sector] ?? "#888" }} />
                <span className="text-muted-foreground">{s.sector}</span>
              </div>
              <span className="font-mono text-foreground">{(s.pct * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const now = useNow();
  const { data: positionsData, isLoading: positionsLoading } = useListPositions();
  const positions = positionsData ?? [];
  const positionSymbols = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { data: quotesData, isLoading: quotesLoading } = useMarketQuotes(positionSymbols, 60_000);
  const isLoading = positionsLoading || quotesLoading;
  const [period, setPeriod] = useState<Period>("3M");
  const [chartView, setChartView] = useState<"total" | "sleeves">("total");

  // Build enriched holdings from positions + real quotes
  const holdings = useMemo(() => {
    const quoteMap = new Map(
      (quotesData?.quotes ?? []).map((q) => [q.symbol, q]),
    );
    return positions.map((pos) => {
      const q = quoteMap.get(pos.ticker);
      const usable = q && isQuoteUsable(q);
      const price = usable ? q.price : 0;
      const dayChange = usable ? (q.change ?? 0) : 0;
      const value = price * pos.shares;
      const badge = usable ? quoteBadge(q) : null;
      const timestamp = usable ? q.timestamp : undefined;
      const isStale = usable ? (q.isStale ?? false) : false;
      const displaySleeve = sleeveLabel(pos.sleeve);
      return { ...pos, sleeve: displaySleeve, price, value, dayChange, badge, timestamp, isStale };
    });
  }, [quotesData, positions]);

  // Sleeve totals derived from real quote-priced holdings
  const sleeveData = useMemo(() => {
    const totals: Record<string, { total: number; dayChange: number }> = {
      "Roth IRA":   { total: 0, dayChange: 0 },
      "Individual": { total: 0, dayChange: 0 },
      "Crypto":     { total: 0, dayChange: 0 },
    };
    for (const h of holdings) {
      if (totals[h.sleeve]) {
        totals[h.sleeve]!.total     += h.value;
        totals[h.sleeve]!.dayChange += h.dayChange * h.shares;
      }
    }
    return totals;
  }, [holdings]);

  const totalValue     = Object.values(sleeveData).reduce((s, v) => s + v.total, 0);
  const totalDayChange = Object.values(sleeveData).reduce((s, v) => s + v.dayChange, 0);
  const totalGain      = holdings.reduce((s, h) => s + (h.price - h.avgCost) * h.shares, 0);
  const totalCost      = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainPct   = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const finalTotals = totalValue > 0 ? {
    roth:   sleeveData["Roth IRA"]!.total,
    indiv:  sleeveData["Individual"]!.total,
    crypto: sleeveData["Crypto"]!.total,
  } : null;

  const fullHistory = useMemo(() => generateHistory(finalTotals), [
    finalTotals?.roth,
    finalTotals?.indiv,
    finalTotals?.crypto,
  ]);

  const chartData = useMemo(() => {
    const n = PERIOD_SLICES[period];
    return fullHistory.slice(-n);
  }, [period, fullHistory]);

  const periodStart  = chartData[0]?.total ?? totalValue;
  const periodGain   = totalValue - periodStart;
  const periodGainPct = periodStart > 0 ? (periodGain / periodStart) * 100 : 0;

  const yMin = useMemo(() => {
    const vals = chartData.map((d) => chartView === "total" ? d.total : Math.min(d.rothIra, d.individual, d.crypto));
    return Math.floor(Math.min(...vals) * 0.98 / 5000) * 5000;
  }, [chartData, chartView]);

  // Determine overall quote freshness label for the header
  const sourceSample = quotesData?.quotes[0];
  const sourceLabel = sourceSample && isQuoteUsable(sourceSample) ? sourceSample.sourceLabel : null;

  // Oldest timestamp among all priced holdings — represents worst-case freshness for total value
  const oldestTimestamp = useMemo(() => {
    const ts = holdings
      .map((h) => h.timestamp)
      .filter((t): t is string => !!t)
      .map((t) => new Date(t).getTime())
      .filter((n) => !Number.isNaN(n));
    if (ts.length === 0) return undefined;
    return new Date(Math.min(...ts)).toISOString();
  }, [holdings]);

  const holdingsSorted = [...holdings].sort((a, b) => b.value - a.value);

  const isDataStale = useMemo(() => {
    if (!oldestTimestamp) return false;
    return now - new Date(oldestTimestamp).getTime() > FRESHNESS_WARNING_MS;
  }, [oldestTimestamp, now]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Briefcase className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
          {isLoading && <span className="text-[10px] font-mono text-muted-foreground animate-pulse">Loading quotes…</span>}
          {sourceLabel && !isLoading && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {sourceLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-8">Prices from live market data · Chart shows simulated history</p>
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
                  Portfolio values may not reflect current market conditions.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Value",   value: totalValue > 0 ? `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—",    sub: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)} today`,   up: totalDayChange >= 0, freshness: oldestTimestamp },
          { label: "Day Change",    value: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)}`,                         sub: `${(totalValue > 0 ? totalDayChange / totalValue * 100 : 0).toFixed(2)}% today`,     up: totalDayChange >= 0, freshness: undefined },
          { label: "Total Gain",    value: totalGain !== 0 ? `${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—", sub: `${totalGainPct.toFixed(1)}% all-time`, up: totalGain >= 0, freshness: undefined },
          { label: "Holdings",      value: String(positions.length),                                                                              sub: "across 3 sleeves",                                                                  up: true, freshness: undefined },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 group cursor-default">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={cn("text-xs mt-1 flex items-center gap-1 font-mono", stat.up ? "text-emerald-400" : "text-red-400")}>
              {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{stat.sub}
            </p>
            {stat.freshness && (
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                as of {freshnessLabel(stat.freshness, now)}
              </p>
            )}
          </div>
        ))}
      </motion.div>

      {/* Performance Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-semibold text-foreground">Performance</h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-muted-foreground">Simulated history</span>
              </div>
              <p className={cn("text-xs font-mono", periodGain >= 0 ? "text-emerald-400" : "text-red-400")}>
                {periodGain >= 0 ? "+" : ""}${Math.abs(periodGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                &ensp;({periodGain >= 0 ? "+" : ""}{periodGainPct.toFixed(2)}%) &nbsp;·&nbsp; {period}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/50">
              {(["total", "sleeves"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                    chartView === v
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "sleeves" ? "By Sleeve" : "Combined"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {(Object.keys(PERIOD_SLICES) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    period === p
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 pt-6 pb-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C4A44A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C4A44A" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradRoth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C4A44A" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#C4A44A" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradIndiv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 15% / 0.6)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(240 5% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                interval={period === "1W" ? 0 : period === "1M" ? 3 : 8}
              />
              <YAxis
                domain={[yMin, "auto"]}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                tick={{ fill: "hsl(240 5% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={54}
              />
              <Tooltip
                content={<ChartTooltip view={chartView} />}
                cursor={{ stroke: "hsl(43 63% 52% / 0.3)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />

              {chartView === "total" ? (
                <Area
                  type="monotone"
                  dataKey="total"
                  name="total"
                  stroke="#C4A44A"
                  strokeWidth={2}
                  fill="url(#gradTotal)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#C4A44A", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              ) : (
                <>
                  <Area type="monotone" dataKey="rothIra"    name="rothIra"    stroke="#C4A44A" strokeWidth={1.5} fill="url(#gradRoth)"   dot={false} activeDot={{ r: 3, fill: "#C4A44A", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                  <Area type="monotone" dataKey="individual" name="individual" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gradIndiv)"  dot={false} activeDot={{ r: 3, fill: "#3b82f6", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                  <Area type="monotone" dataKey="crypto"     name="crypto"     stroke="#10b981" strokeWidth={1.5} fill="url(#gradCrypto)" dot={false} activeDot={{ r: 3, fill: "#10b981", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", paddingTop: 12 }}
                    formatter={(value) =>
                      value === "rothIra" ? "Roth IRA" : value === "individual" ? "Individual" : "Crypto"
                    }
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sleeve cards + sector allocation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {SLEEVES.map((sleeve, i) => {
          const data = sleeveData[sleeve.key] ?? { total: 0, dayChange: 0 };
          const pct = totalValue > 0 ? (data.total / totalValue) * 100 : 0;
          return (
            <motion.div
              key={sleeve.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{sleeve.icon}</span>
                <h3 className="font-display font-semibold text-sm text-foreground">{sleeve.label}</h3>
              </div>
              <p className="font-mono text-xl font-bold text-foreground mb-0.5">
                {data.total > 0 ? `$${data.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
              </p>
              <p className={cn("text-xs font-mono mb-3", data.dayChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                {data.dayChange >= 0 ? "+" : ""}${Math.abs(data.dayChange).toFixed(0)}&ensp;({pct.toFixed(1)}% of total)
              </p>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Weight</span><span>{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.1 }}
                    className={cn("h-full rounded-full", sleeve.color)}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <SectorAllocation holdings={holdingsSorted} />
        </motion.div>
      </div>

      {/* Holdings table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-display font-semibold text-primary">All Holdings</h2>
          <span className="text-[10px] text-muted-foreground font-mono">
            Sorted by value · {positions.length} positions · {sourceLabel ?? "Loading prices…"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Ticker", "Name", "Sleeve", "Shares", "Avg Cost", "Price", "Value", "Gain $", "Gain %"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdingsSorted.map((h, i) => {
                const gain    = h.price > 0 ? (h.price - h.avgCost) * h.shares : 0;
                const gainPct = h.price > 0 ? ((h.price - h.avgCost) / h.avgCost) * 100 : 0;
                return (
                  <motion.tr
                    key={h.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary group-hover:text-primary/80">{h.ticker}</span>
                        {h.badge && (
                          <span className={cn("text-[8px] font-mono font-bold px-1 py-0.5 rounded", {
                            "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20": h.badge.tone === "live",
                            "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20": h.badge.tone === "delayed",
                            "text-amber-400 bg-amber-500/10 border border-amber-500/20": h.badge.tone === "stale",
                            "text-muted-foreground bg-muted/30 border border-border/40": h.badge.tone === "ref",
                          })}>
                            {h.badge.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{h.name}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted/50 border border-border/50 text-muted-foreground">{h.sleeve}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{h.shares}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">${h.avgCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-foreground">
                        {h.price > 0 ? `$${h.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                      </div>
                      {h.timestamp && (
                        <div className={cn("font-mono text-[9px] mt-0.5", h.isStale ? "text-amber-400" : "text-muted-foreground/60")}>
                          {freshnessLabel(h.timestamp, now)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                      {h.value > 0 ? `$${h.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", gain >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {h.price > 0 ? `${gain >= 0 ? "+" : ""}$${Math.abs(gain).toFixed(0)}` : "—"}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", gainPct >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {h.price > 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : "—"}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
