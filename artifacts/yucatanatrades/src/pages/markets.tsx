import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Globe } from "lucide-react";
import { mockMarketData } from "@/data/mockData";
import { cn } from "@/lib/utils";

const TABS = ["All", "Stocks", "Crypto", "ETFs", "Watchlist"];

const EXTENDED_MARKET = [
  ...mockMarketData,
  { symbol: "XRP", price: 0.523, change: 0.021, changePercent: 4.18 },
  { symbol: "META", price: 510.30, change: 8.4, changePercent: 1.67 },
  { symbol: "ORCL", price: 128.55, change: -1.2, changePercent: -0.92 },
  { symbol: "NOW", price: 710.20, change: 5.6, changePercent: 0.79 },
  { symbol: "ANET", price: 318.40, change: 3.1, changePercent: 0.98 },
  { symbol: "MU", price: 88.75, change: -0.9, changePercent: -1.00 },
  { symbol: "KTOS", price: 36.40, change: 1.8, changePercent: 5.20 },
];

const CATEGORY: Record<string, string[]> = {
  Stocks: ["MSFT", "NVDA", "AVGO", "META", "ORCL", "NOW", "ANET", "MU", "KTOS"],
  Crypto: ["BTC", "ETH", "SOL", "SUI", "XRP"],
  ETFs: ["SPY", "QQQ", "IWM", "DIA"],
  Watchlist: ["MSFT", "AVGO", "KTOS", "BTC", "ETH", "SOL", "NVDA"],
};

type Market = typeof EXTENDED_MARKET[0];

function IndexCard({ m }: { m: Market }) {
  const up = m.change >= 0;
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn("glass-card p-5 cursor-pointer transition-all", up ? "hover:border-emerald-500/30" : "hover:border-red-500/30")}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono font-bold text-primary text-base">{m.symbol}</span>
        {up ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <p className="font-mono text-2xl font-bold text-foreground mb-1">
        {m.price >= 10000 ? `$${m.price.toLocaleString()}` : m.price >= 100 ? `$${m.price.toFixed(2)}` : m.price >= 1 ? `$${m.price.toFixed(2)}` : `$${m.price.toFixed(4)}`}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn("font-mono text-xs font-semibold px-1.5 py-0.5 rounded", up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
          {up ? "+" : ""}{m.changePercent.toFixed(2)}%
        </span>
        <span className={cn("font-mono text-xs", up ? "text-emerald-400" : "text-red-400")}>
          {up ? "+" : ""}{m.change.toFixed(m.price < 1 ? 4 : 2)}
        </span>
      </div>
    </motion.div>
  );
}

export default function Markets() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = EXTENDED_MARKET.filter((m) => {
    if (activeTab === "All") return true;
    const allowed = CATEGORY[activeTab];
    return allowed ? allowed.includes(m.symbol) : true;
  });

  const gainers = [...EXTENDED_MARKET].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...EXTENDED_MARKET].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Markets</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold ml-2">OPEN</span>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Live prices across equities, crypto, and ETFs · 15min delayed</p>
      </motion.div>

      {/* Gainers / Losers */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-display font-semibold text-foreground">Top Gainers</h3>
          </div>
          <div className="space-y-2">
            {gainers.map((m) => (
              <div key={m.symbol} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="font-mono text-sm font-bold text-primary">{m.symbol}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    ${m.price >= 100 ? m.price.toFixed(2) : m.price.toFixed(4)}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-semibold">+{m.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-display font-semibold text-foreground">Underperformers</h3>
          </div>
          <div className="space-y-2">
            {losers.map((m) => (
              <div key={m.symbol} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="font-mono text-sm font-bold text-primary">{m.symbol}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    ${m.price >= 100 ? m.price.toFixed(2) : m.price.toFixed(4)}
                  </span>
                  <span className="font-mono text-xs text-red-400 font-semibold">{m.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sector Heatmap */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold text-foreground">Sector Heatmap</h3>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {[
            { name: "AI / Tech", change: 1.4 },
            { name: "Semis", change: 2.1 },
            { name: "Defense", change: 0.8 },
            { name: "Nuclear", change: 1.2 },
            { name: "Crypto", change: 3.5 },
            { name: "Fintech", change: -0.6 },
            { name: "Biotech", change: -1.2 },
            { name: "Energy", change: 0.3 },
            { name: "Quantum", change: 4.2 },
            { name: "Space", change: 2.8 },
            { name: "REITs", change: -0.9 },
            { name: "Utilities", change: 0.5 },
          ].map((sector) => (
            <div
              key={sector.name}
              className={cn(
                "p-3 rounded-lg text-center border transition-colors",
                sector.change >= 2
                  ? "bg-emerald-500/25 border-emerald-500/30"
                  : sector.change >= 0
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : sector.change >= -1
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-red-500/20 border-red-500/30"
              )}
            >
              <p className="text-[10px] font-semibold text-foreground/70">{sector.name}</p>
              <p className={cn("font-mono text-sm font-bold mt-0.5", sector.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                {sector.change >= 0 ? "+" : ""}{sector.change.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tab filter + Price grid */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((m, i) => (
          <motion.div key={m.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <IndexCard m={m} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
