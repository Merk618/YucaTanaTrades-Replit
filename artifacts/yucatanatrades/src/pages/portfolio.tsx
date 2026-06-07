import { motion } from "framer-motion";
import { Briefcase, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useGetPortfolioSummary } from "@workspace/api-client-react";
import { mockPortfolioData } from "@/data/mockData";
import { cn } from "@/lib/utils";

const HOLDINGS = [
  { ticker: "NVDA", name: "NVIDIA Corp.", shares: 12, avgCost: 650.00, price: 890.12, value: 10681.44, sleeve: "Roth IRA", sector: "Semis" },
  { ticker: "AVGO", name: "Broadcom Inc.", shares: 5, avgCost: 1100.00, price: 1340.50, value: 6702.50, sleeve: "Roth IRA", sector: "Semis" },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 18, avgCost: 340.00, price: 420.55, value: 7569.90, sleeve: "Individual", sector: "Tech" },
  { ticker: "SMR", name: "NuScale Power", shares: 400, avgCost: 5.50, price: 8.90, value: 3560.00, sleeve: "Individual", sector: "Nuclear" },
  { ticker: "BTC", name: "Bitcoin", shares: 0.28, avgCost: 42000.00, price: 65432.10, value: 18320.99, sleeve: "Crypto", sector: "Crypto" },
  { ticker: "ETH", name: "Ethereum", shares: 2.1, avgCost: 2100.00, price: 3456.78, value: 7259.24, sleeve: "Crypto", sector: "Crypto" },
  { ticker: "SOL", name: "Solana", shares: 8.5, avgCost: 100.00, price: 145.20, value: 1234.20, sleeve: "Crypto", sector: "Crypto" },
  { ticker: "KTOS", name: "Kratos Defense", shares: 150, avgCost: 18.00, price: 36.40, value: 5460.00, sleeve: "Individual", sector: "Defense" },
  { ticker: "ASTS", name: "AST SpaceMobile", shares: 200, avgCost: 10.50, price: 15.40, value: 3080.00, sleeve: "Roth IRA", sector: "Space" },
];

const SLEEVES = [
  { label: "Roth IRA", key: "rothIra", color: "bg-primary", icon: "🏛️" },
  { label: "Individual", key: "individual", color: "bg-blue-500", icon: "💼" },
  { label: "Crypto", key: "crypto", color: "bg-emerald-500", icon: "🪙" },
];

export default function Portfolio() {
  const { data: portfolioSummary } = useGetPortfolioSummary();

  const sleeveData: Record<string, { total: number; dayChange: number; dayChangePercent: number }> = {
    rothIra: portfolioSummary?.rothIra ? { total: portfolioSummary.rothIra, dayChange: 450.20, dayChangePercent: 0.36 } : mockPortfolioData.rothIra,
    individual: portfolioSummary?.individual ? { total: portfolioSummary.individual, dayChange: -120.40, dayChangePercent: -0.18 } : mockPortfolioData.individual,
    crypto: portfolioSummary?.crypto ? { total: portfolioSummary.crypto, dayChange: 850.75, dayChangePercent: 3.08 } : mockPortfolioData.crypto,
  };

  const totalValue = Object.values(sleeveData).reduce((s, v) => s + v.total, 0);
  const totalDayChange = Object.values(sleeveData).reduce((s, v) => s + v.dayChange, 0);
  const totalGain = HOLDINGS.reduce((s, h) => s + (h.price - h.avgCost) * h.shares, 0);
  const totalCost = HOLDINGS.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainPct = (totalGain / totalCost) * 100;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Briefcase className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Across Roth IRA, individual account, and crypto</p>
      </motion.div>

      {/* Totals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Value", value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)} today`, up: totalDayChange >= 0 },
          { label: "Day Change", value: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)}`, sub: `${(totalDayChange / totalValue * 100).toFixed(2)}% today`, up: totalDayChange >= 0 },
          { label: "Total Gain", value: `${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: `${totalGainPct.toFixed(1)}% all-time`, up: totalGain >= 0 },
          { label: "Holdings", value: String(HOLDINGS.length), sub: "across 3 sleeves", up: true },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={cn("text-xs mt-1 flex items-center gap-1 font-mono", stat.up ? "text-emerald-400" : "text-red-400")}>
              {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{stat.sub}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Sleeve cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SLEEVES.map((sleeve, i) => {
          const data = sleeveData[sleeve.key];
          const pct = (data.total / totalValue) * 100;
          return (
            <motion.div
              key={sleeve.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{sleeve.icon}</span>
                <h3 className="font-display font-semibold text-foreground">{sleeve.label}</h3>
              </div>
              <p className="font-mono text-2xl font-bold text-foreground mb-1">
                ${data.total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className={cn("text-xs font-mono mb-3", data.dayChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                {data.dayChange >= 0 ? "+" : ""}${Math.abs(data.dayChange).toFixed(0)} ({data.dayChangePercent >= 0 ? "+" : ""}{data.dayChangePercent.toFixed(2)}%) today
              </p>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Portfolio weight</span>
                  <span>{pct.toFixed(1)}%</span>
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
      </div>

      {/* Holdings table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-display font-semibold text-primary">All Holdings</h2>
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
              {HOLDINGS.sort((a, b) => b.value - a.value).map((h, i) => {
                const gain = (h.price - h.avgCost) * h.shares;
                const gainPct = ((h.price - h.avgCost) / h.avgCost) * 100;
                return (
                  <motion.tr
                    key={h.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary">{h.ticker}</td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{h.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{h.sleeve}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{h.shares}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">${h.avgCost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">${h.price.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">${h.value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", gain >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {gain >= 0 ? "+" : ""}${Math.abs(gain).toFixed(0)}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", gainPct >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
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
