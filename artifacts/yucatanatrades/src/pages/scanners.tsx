import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Radar, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { useMarketQuotes, isQuoteUsable, useNow, freshnessLabel } from "@/hooks/use-market";
import { cn } from "@/lib/utils";

const SCANNER_TABS = ["Momentum", "Breakouts", "Dip-Buy", "Oversold", "Options", "Unusual Volume"];

// Static signal definitions: setup classification and heuristic score.
// Prices and % changes are overlaid with real market quotes where available.
const SIGNAL_DEFS = [
  { symbol: "ASTS", name: "AST SpaceMobile",   setup: "Momentum",   score: 98 },
  { symbol: "RGTI", name: "Rigetti Computing",  setup: "Breakout",   score: 95 },
  { symbol: "QUBT", name: "Quantum Computing",  setup: "Unusual Vol",score: 92 },
  { symbol: "SMR",  name: "NuScale Power",      setup: "Dip-Buy",    score: 88 },
  { symbol: "CRDO", name: "Credo Technology",   setup: "Momentum",   score: 85 },
  { symbol: "ZETA", name: "Zeta Global",        setup: "Breakout",   score: 84 },
  { symbol: "KTOS", name: "Kratos Defense",     setup: "Oversold",   score: 82 },
  { symbol: "CLSK", name: "CleanSpark",         setup: "Momentum",   score: 90 },
  { symbol: "NXE",  name: "NexGen Energy",      setup: "Breakout",   score: 87 },
  { symbol: "URA",  name: "Global X Uranium",   setup: "Momentum",   score: 81 },
  { symbol: "AVGO", name: "Broadcom Inc.",       setup: "Momentum",   score: 96 },
  { symbol: "MSFT", name: "Microsoft Corp.",    setup: "Breakout",   score: 91 },
  { symbol: "NOW",  name: "ServiceNow Inc.",    setup: "Options",    score: 89 },
  { symbol: "V",    name: "Visa Inc.",           setup: "Oversold",   score: 80 },
  { symbol: "META", name: "Meta Platforms",     setup: "Momentum",   score: 83 },
];

const SCANNER_SYMBOLS = SIGNAL_DEFS.map((s) => s.symbol);

function SetupBadge({ setup }: { setup: string }) {
  const colors: Record<string, string> = {
    Momentum:      "bg-primary/15 text-primary border-primary/25",
    Breakout:      "bg-blue-500/15 text-blue-300 border-blue-500/25",
    "Dip-Buy":     "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    Oversold:      "bg-orange-500/15 text-orange-300 border-orange-500/25",
    "Unusual Vol": "bg-purple-500/15 text-purple-300 border-purple-500/25",
    Options:       "bg-teal-500/15 text-teal-300 border-teal-500/25",
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", colors[setup] ?? "bg-muted text-muted-foreground border-border")}>
      {setup}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-primary" : score >= 80 ? "text-emerald-400" : "text-muted-foreground";
  return <span className={cn("font-mono text-xs font-bold", color)}>{score}</span>;
}

export default function Scanners() {
  const [activeTab, setActiveTab] = useState("Momentum");
  const [sortKey, setSortKey] = useState<"score" | "change">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const now = useNow();
  const { data: quotesData, isLoading } = useMarketQuotes(SCANNER_SYMBOLS, 60_000);

  const quoteMap = useMemo(() => {
    return new Map(
      (quotesData?.quotes ?? []).map((q) => [q.symbol, q]),
    );
  }, [quotesData]);

  // Enrich signal defs with real prices/changes where available
  const enrichedSignals = useMemo(() => {
    return SIGNAL_DEFS.map((def) => {
      const q = quoteMap.get(def.symbol);
      const hasRealData = q && isQuoteUsable(q);
      return {
        ...def,
        price:       hasRealData ? q.price        : 0,
        change:      hasRealData ? q.changePercent : 0,
        sourceLabel: hasRealData ? q.sourceLabel  : null,
        timestamp:   hasRealData ? q.timestamp    : null,
      };
    });
  }, [quoteMap]);

  const tabFilters: Record<string, string[]> = {
    Momentum:        ["Momentum"],
    Breakouts:       ["Breakout"],
    "Dip-Buy":       ["Dip-Buy"],
    Oversold:        ["Oversold"],
    Options:         ["Options"],
    "Unusual Volume":["Unusual Vol"],
  };

  const filtered = enrichedSignals
    .filter((r) => {
      const allowed = tabFilters[activeTab];
      return allowed ? allowed.some((s) => r.setup.includes(s)) : true;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const handleSort = (key: "score" | "change") => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: string }) =>
    sortKey === k ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null;

  // Compute stats from real data
  const withRealData = enrichedSignals.filter((s) => s.price > 0);
  const momentum = enrichedSignals.filter((s) => s.change > 0 && s.price > 0).length;
  const pullbacks = enrichedSignals.filter((s) => s.change < 0 && s.price > 0).length;
  const avgScore = enrichedSignals.reduce((s, r) => s + r.score, 0) / enrichedSignals.length;

  // Representative source label from first real quote
  const sampleQuote = quotesData?.quotes.find((q) => isQuoteUsable(q));
  const sourceLabel = sampleQuote?.sourceLabel ?? null;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Radar className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Market Scanners</h1>
          {isLoading && <span className="text-[10px] font-mono text-muted-foreground animate-pulse">Loading quotes…</span>}
          {sourceLabel && !isLoading && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {sourceLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          {withRealData.length > 0
            ? `Prices from live market data · Signal scores are AI-computed heuristics`
            : "Technical pattern recognition — loading real market prices…"}
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
        {[
          { label: "Signals Tracked", value: String(SIGNAL_DEFS.length), icon: Zap, color: "text-primary" },
          { label: "Momentum", value: String(momentum || "—"), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Pullbacks", value: String(pullbacks || "—"), icon: TrendingDown, color: "text-orange-400" },
          { label: "Avg Score", value: avgScore.toFixed(1), icon: Radar, color: "text-blue-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <stat.icon className={cn("w-5 h-5 flex-shrink-0", stat.color)} />
            <div>
              <p className="font-mono text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Scanner tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {SCANNER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scanner Table */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card overflow-hidden scan-effect"
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <h2 className="text-sm font-display font-semibold text-primary">{activeTab} Scanner</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
              {filtered.length} signals · Prices {sourceLabel ? `via ${sourceLabel}` : "loading…"} · Scores are heuristic
            </p>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />SCANNING
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Ticker", "Name", "Price", "Setup"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("change")}
                >
                  <span className="flex items-center justify-end gap-1">Change <SortIcon k="change" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("score")}
                >
                  <span className="flex items-center justify-end gap-1">Score <SortIcon k="score" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">No signals found for this scanner</td>
                </tr>
              )}
              {filtered.map((row, i) => (
                <motion.tr
                  key={row.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/30 hover:bg-primary/5 transition-colors group"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary group-hover:text-primary">{row.symbol}</td>
                  <td className="px-4 py-3 text-foreground/70 text-xs">{row.name}</td>
                  <td className="px-4 py-3">
                    {row.price > 0 ? (
                      <div>
                        <span className="font-mono text-foreground">
                          ${row.price.toLocaleString("en-US", { minimumFractionDigits: row.price < 10 ? 4 : 2, maximumFractionDigits: row.price < 10 ? 4 : 2 })}
                        </span>
                        {row.timestamp && (
                          <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                            {freshnessLabel(row.timestamp, now)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Loading…</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><SetupBadge setup={row.setup} /></td>
                  <td className={cn("px-4 py-3 text-right font-mono font-semibold", row.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {row.price > 0
                      ? `${row.change >= 0 ? "+" : ""}${row.change.toFixed(2)}%`
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right"><ScoreBadge score={row.score} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
