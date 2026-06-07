import { useState } from "react";
import { motion } from "framer-motion";
import { Radar, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { mockScannerResults } from "@/data/mockData";
import { cn } from "@/lib/utils";

const SCANNER_TABS = ["Momentum", "Breakouts", "Dip-Buy", "Oversold", "Options", "Unusual Volume"];

const EXTRA_RESULTS = [
  { symbol: "AVGO", name: "Broadcom Inc.", price: 1340.50, volume: "3.2M", setup: "Momentum", score: 96, change: 2.8 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 420.55, volume: "22.1M", setup: "Breakout", score: 91, change: 1.9 },
  { symbol: "NOW", name: "ServiceNow Inc.", price: 710.20, volume: "1.1M", setup: "Options", score: 89, change: 3.2 },
  { symbol: "V", name: "Visa Inc.", price: 262.80, volume: "5.6M", setup: "Oversold", score: 80, change: -2.1 },
  { symbol: "META", name: "Meta Platforms", price: 510.30, volume: "8.4M", setup: "Momentum", score: 83, change: 1.7 },
  { symbol: "KTOS", name: "Kratos Defense", price: 36.40, volume: "1.5M", setup: "Dip-Buy", score: 82, change: -1.2 },
];

const ALL_RESULTS = [...mockScannerResults, ...EXTRA_RESULTS];

function SetupBadge({ setup }: { setup: string }) {
  const colors: Record<string, string> = {
    Momentum: "bg-primary/15 text-primary border-primary/25",
    Breakout: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    "Dip-Buy": "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    Oversold: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    "Unusual Vol": "bg-purple-500/15 text-purple-300 border-purple-500/25",
    Options: "bg-teal-500/15 text-teal-300 border-teal-500/25",
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

  const tabFilters: Record<string, string[]> = {
    Momentum: ["Momentum"],
    Breakouts: ["Breakout"],
    "Dip-Buy": ["Dip-Buy"],
    Oversold: ["Oversold"],
    Options: ["Options"],
    "Unusual Volume": ["Unusual Vol"],
  };

  const filtered = ALL_RESULTS
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

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Radar className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Market Scanners</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Real-time technical pattern recognition across 3,000+ securities</p>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
        {[
          { label: "Signals Today", value: "247", icon: Zap, color: "text-primary" },
          { label: "Momentum", value: "89", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Pullbacks", value: "54", icon: TrendingDown, color: "text-orange-400" },
          { label: "Avg Score", value: "84.2", icon: Radar, color: "text-blue-400" },
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
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-display font-semibold text-primary">{activeTab} Scanner</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} signals found · Updated 30s ago</p>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono px-2 py-1 rounded bg-muted/50 border border-border/50">LIVE DATA CONNECT: TODO</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Ticker", "Name", "Price", "Setup", "Volume"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground flex items-center justify-end gap-1"
                  onClick={() => handleSort("change")}
                >
                  Change <SortIcon k="change" />
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
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">No signals found for this scanner</td>
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
                  <td className="px-4 py-3 font-mono text-foreground">${row.price.toFixed(2)}</td>
                  <td className="px-4 py-3"><SetupBadge setup={row.setup} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.volume}</td>
                  <td className={cn("px-4 py-3 text-right font-mono font-semibold", row.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {row.change >= 0 ? "+" : ""}{row.change.toFixed(1)}%
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
