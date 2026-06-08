import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
import { Briefcase, ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { useGetPortfolioSummary } from "@workspace/api-client-react";
import { mockPortfolioData } from "@/data/mockData";
import { DemoBadge } from "@/components/demo-badge";
import { cn } from "@/lib/utils";

// ─── Deterministic mock portfolio history (90 trading days) ─────────────────
function generateHistory() {
  // LCG pseudo-random, deterministic seed
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
    // skip weekends for stock-like cadence
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    // daily walk with positive drift
    roth   *= 1 + 0.00025 + (r() - 0.5) * 0.016;
    indiv  *= 1 + 0.00018 + (r() - 0.5) * 0.014;
    crypto *= 1 + 0.00040 + (r() - 0.5) * 0.046;

    // soft clamp to realistic ranges
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
  // pin last row to current mock totals so chart ends correctly
  const last = result[result.length - 1];
  if (last) {
    last.rothIra = 125430;
    last.individual = 67890;
    last.crypto = 28450;
    last.total = 221770;
  }
  return result;
}

const FULL_HISTORY = generateHistory();

const PERIOD_SLICES = { "1W": 5, "1M": 22, "3M": 65 } as const;
type Period = keyof typeof PERIOD_SLICES;

// ─── Holdings ───────────────────────────────────────────────────────────────
const HOLDINGS = [
  { ticker: "NVDA", name: "NVIDIA Corp.",    shares: 12,   avgCost: 650.00,   price: 890.12,   value: 10681.44, sleeve: "Roth IRA",   sector: "Semis"   },
  { ticker: "AVGO", name: "Broadcom Inc.",   shares: 5,    avgCost: 1100.00,  price: 1340.50,  value: 6702.50,  sleeve: "Roth IRA",   sector: "Semis"   },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 18,   avgCost: 340.00,   price: 420.55,   value: 7569.90,  sleeve: "Individual", sector: "Tech"    },
  { ticker: "SMR",  name: "NuScale Power",   shares: 400,  avgCost: 5.50,     price: 8.90,     value: 3560.00,  sleeve: "Individual", sector: "Nuclear" },
  { ticker: "BTC",  name: "Bitcoin",         shares: 0.28, avgCost: 42000.00, price: 65432.10, value: 18320.99, sleeve: "Crypto",     sector: "Crypto"  },
  { ticker: "ETH",  name: "Ethereum",        shares: 2.1,  avgCost: 2100.00,  price: 3456.78,  value: 7259.24,  sleeve: "Crypto",     sector: "Crypto"  },
  { ticker: "SOL",  name: "Solana",          shares: 8.5,  avgCost: 100.00,   price: 145.20,   value: 1234.20,  sleeve: "Crypto",     sector: "Crypto"  },
  { ticker: "KTOS", name: "Kratos Defense",  shares: 150,  avgCost: 18.00,    price: 36.40,    value: 5460.00,  sleeve: "Individual", sector: "Defense" },
  { ticker: "ASTS", name: "AST SpaceMobile", shares: 200,  avgCost: 10.50,    price: 15.40,    value: 3080.00,  sleeve: "Roth IRA",   sector: "Space"   },
];

const SLEEVES = [
  { label: "Roth IRA",   key: "rothIra",    color: "bg-primary",       chartColor: "#C4A44A", icon: "🏛️" },
  { label: "Individual", key: "individual", color: "bg-blue-500",      chartColor: "#3b82f6", icon: "💼" },
  { label: "Crypto",     key: "crypto",     color: "bg-emerald-500",   chartColor: "#10b981", icon: "🪙" },
];

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
            <span className="text-muted-foreground capitalize">{p.name === "rothIra" ? "Roth IRA" : p.name === "individual" ? "Individual" : p.name === "crypto" ? "Crypto" : "Total"}</span>
          </div>
          <span className="font-mono font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sector donut (SVG-based, lightweight) ───────────────────────────────────
const SECTOR_COLORS: Record<string, string> = {
  Semis: "#C4A44A", Tech: "#3b82f6", Nuclear: "#f97316",
  Defense: "#8b5cf6", Crypto: "#10b981", Space: "#06b6d4",
};

function SectorAllocation() {
  const sectors = HOLDINGS.reduce<Record<string, number>>((acc, h) => {
    acc[h.sector] = (acc[h.sector] ?? 0) + h.value;
    return acc;
  }, {});
  const total = Object.values(sectors).reduce((s, v) => s + v, 0);

  let offset = 0;
  const slices = Object.entries(sectors).map(([sector, value]) => {
    const pct = value / total;
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
            <span className="font-mono font-bold text-sm text-foreground">{HOLDINGS.length}</span>
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { data: portfolioSummary } = useGetPortfolioSummary();
  const [period, setPeriod] = useState<Period>("3M");
  const [chartView, setChartView] = useState<"total" | "sleeves">("total");

  const sleeveData: Record<string, { total: number; dayChange: number; dayChangePercent: number }> = {
    rothIra:    portfolioSummary?.rothIra    ? { total: portfolioSummary.rothIra,    dayChange: 450.20,  dayChangePercent:  0.36 } : mockPortfolioData.rothIra,
    individual: portfolioSummary?.individual ? { total: portfolioSummary.individual, dayChange: -120.40, dayChangePercent: -0.18 } : mockPortfolioData.individual,
    crypto:     portfolioSummary?.crypto     ? { total: portfolioSummary.crypto,     dayChange:  850.75, dayChangePercent:  3.08 } : mockPortfolioData.crypto,
  };

  const totalValue     = Object.values(sleeveData).reduce((s, v) => s + v.total, 0);
  const totalDayChange = Object.values(sleeveData).reduce((s, v) => s + v.dayChange, 0);
  const totalGain      = HOLDINGS.reduce((s, h) => s + (h.price - h.avgCost) * h.shares, 0);
  const totalCost      = HOLDINGS.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainPct   = (totalGain / totalCost) * 100;

  const chartData = useMemo(() => {
    const n = PERIOD_SLICES[period];
    return FULL_HISTORY.slice(-n);
  }, [period]);

  // derive gain/loss over selected period
  const periodStart = chartData[0]?.total ?? totalValue;
  const periodGain  = totalValue - periodStart;
  const periodGainPct = (periodGain / periodStart) * 100;

  const yMin = useMemo(() => {
    const vals = chartData.map((d) => chartView === "total" ? d.total : Math.min(d.rothIra, d.individual, d.crypto));
    return Math.floor(Math.min(...vals) * 0.98 / 5000) * 5000;
  }, [chartData, chartView]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Briefcase className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
          <DemoBadge />
        </div>
        <p className="text-muted-foreground text-sm ml-8">Across Roth IRA, individual account, and crypto — holdings shown are simulated demo data</p>
      </motion.div>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Value",   value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,                                                      sub: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)} today`,     up: totalDayChange >= 0 },
          { label: "Day Change",    value: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)}`,                                                   sub: `${(totalDayChange / totalValue * 100).toFixed(2)}% today`,                           up: totalDayChange >= 0 },
          { label: "Total Gain",    value: `${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,                 sub: `${totalGainPct.toFixed(1)}% all-time`,                                               up: totalGain >= 0 },
          { label: "Holdings",      value: String(HOLDINGS.length),                                                                                                        sub: "across 3 sleeves",                                                                   up: true },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 group cursor-default">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={cn("text-xs mt-1 flex items-center gap-1 font-mono", stat.up ? "text-emerald-400" : "text-red-400")}>
              {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{stat.sub}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Performance Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card overflow-hidden">
        {/* Chart header */}
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <div>
              <h2 className="text-sm font-display font-semibold text-foreground">Performance</h2>
              <p className={cn("text-xs font-mono", periodGain >= 0 ? "text-emerald-400" : "text-red-400")}>
                {periodGain >= 0 ? "+" : ""}${Math.abs(periodGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                &ensp;({periodGain >= 0 ? "+" : ""}{periodGainPct.toFixed(2)}%) &nbsp;·&nbsp; {period}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
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
            {/* Period tabs */}
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

        {/* Chart area */}
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

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225 15% 15% / 0.6)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(240 5% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                interval={period === "1W" ? 0 : period === "1M" ? 3 : 8}
              />

              <YAxis
                domain={[yMin, "auto"]}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
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
                  <Area
                    type="monotone"
                    dataKey="rothIra"
                    name="rothIra"
                    stroke="#C4A44A"
                    strokeWidth={1.5}
                    fill="url(#gradRoth)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#C4A44A", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="individual"
                    name="individual"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    fill="url(#gradIndiv)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#3b82f6", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="crypto"
                    name="crypto"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fill="url(#gradCrypto)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#10b981", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
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
                <span className="text-base">{sleeve.icon}</span>
                <h3 className="font-display font-semibold text-sm text-foreground">{sleeve.label}</h3>
              </div>
              <p className="font-mono text-xl font-bold text-foreground mb-0.5">
                ${data.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className={cn("text-xs font-mono mb-3", data.dayChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                {data.dayChange >= 0 ? "+" : ""}${Math.abs(data.dayChange).toFixed(0)}&ensp;({data.dayChangePercent >= 0 ? "+" : ""}{data.dayChangePercent.toFixed(2)}%)
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

        {/* Sector allocation in 4th column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <SectorAllocation />
        </motion.div>
      </div>

      {/* Holdings table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-display font-semibold text-primary">All Holdings</h2>
          <span className="text-[10px] text-muted-foreground font-mono">
            Sorted by value · {HOLDINGS.length} positions
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
              {HOLDINGS.sort((a, b) => b.value - a.value).map((h, i) => {
                const gain    = (h.price - h.avgCost) * h.shares;
                const gainPct = ((h.price - h.avgCost) / h.avgCost) * 100;
                return (
                  <motion.tr
                    key={h.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary group-hover:text-primary/80">{h.ticker}</td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{h.name}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted/50 border border-border/50 text-muted-foreground">{h.sleeve}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{h.shares}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">${h.avgCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">${h.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">${h.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
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
