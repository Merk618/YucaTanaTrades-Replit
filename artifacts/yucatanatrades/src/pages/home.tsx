import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Bot, Zap, Shield, Activity, ArrowUpRight, ArrowDownRight, Newspaper } from "lucide-react";
import { mockMarketData, mockPortfolioData, mockScannerResults, mockBotStatus, mockNewsCatalysts } from "@/data/mockData";
import { useGetPortfolioSummary, useGetBotsStatus } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function MetricCard({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <motion.div variants={item} className="glass-card p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
      {sub && (
        <p className={cn("text-xs mt-1 flex items-center gap-1 font-mono", up ? "text-emerald-400" : "text-red-400")}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </motion.div>
  );
}

export default function Home() {
  const { data: portfolioSummary } = useGetPortfolioSummary();
  const { data: botStatus } = useGetBotsStatus();

  const portfolio = portfolioSummary ?? {
    totalValue: mockPortfolioData.rothIra.total + mockPortfolioData.individual.total + mockPortfolioData.crypto.total,
    dayChange: mockPortfolioData.rothIra.dayChange + mockPortfolioData.individual.dayChange + mockPortfolioData.crypto.dayChange,
    dayChangePct: 0.62,
    totalGain: 42183.44,
    totalGainPct: 23.6,
  };

  const bots = botStatus ?? mockBotStatus;

  const topOpps = mockScannerResults.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Hero header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MARKETS OPEN
          </span>
          <span className="text-xs text-muted-foreground">NYSE · NASDAQ · CRYPTO 24/7</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">AI Market Command Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Your intelligent trading intelligence hub — real-time across all markets</p>
      </motion.div>

      {/* Portfolio snapshot metrics */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Portfolio"
          value={`$${portfolio.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub={`${portfolio.dayChangePct >= 0 ? "+" : ""}${portfolio.dayChangePct.toFixed(2)}% today`}
          up={portfolio.dayChangePct >= 0}
        />
        <MetricCard
          label="Day P&L"
          value={`${portfolio.dayChange >= 0 ? "+" : ""}$${Math.abs(portfolio.dayChange).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={portfolio.dayChange >= 0 ? "Positive session" : "Negative session"}
          up={portfolio.dayChange >= 0}
        />
        <MetricCard
          label="Total Gain"
          value={`+$${portfolio.totalGain?.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "—"}`}
          sub={`+${portfolio.totalGainPct?.toFixed(1) ?? "—"}% all-time`}
          up
        />
        <MetricCard
          label="Active Bots"
          value="2 / 2"
          sub="All systems nominal"
          up
        />
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Market index strip */}
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-display font-semibold text-primary uppercase tracking-widest">Index Overview</h2>
              <span className="text-xs text-muted-foreground">Delayed 15min</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {mockMarketData.slice(0, 8).map((m) => (
                <div key={m.symbol} className="p-3 rounded-lg bg-background/60 border border-border/40 hover:border-primary/30 transition-colors">
                  <p className="font-mono text-xs font-bold text-primary">{m.symbol}</p>
                  <p className="font-mono text-base font-semibold text-foreground mt-0.5">
                    {m.price >= 1000 ? `$${m.price.toLocaleString()}` : `$${m.price.toFixed(2)}`}
                  </p>
                  <p className={cn("font-mono text-xs mt-0.5", m.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {m.change >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Opportunities + Risk Alerts */}
          <div className="grid grid-cols-2 gap-6">
            <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">Top Opportunities</h3>
              </div>
              <div className="space-y-2">
                {topOpps.map((opp) => (
                  <div key={opp.symbol} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 group">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground group-hover:text-primary transition-colors">{opp.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{opp.setup}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono text-sm font-semibold", opp.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {opp.change >= 0 ? "+" : ""}{opp.change.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">#{opp.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">Risk Alerts</h3>
              </div>
              <div className="space-y-3">
                {[
                  { level: "warn", msg: "NVDA options IV elevated — expiry this week" },
                  { level: "info", msg: "Fed minutes release Thursday 2pm ET" },
                  { level: "warn", msg: "BTC futures funding rate positive — caution" },
                  { level: "ok", msg: "Portfolio margin at 18% — within safe limits" },
                ].map((alert, i) => (
                  <div key={i} className={cn("flex items-start gap-2 text-xs p-2 rounded-lg border", {
                    "border-orange-500/20 bg-orange-500/5 text-orange-300": alert.level === "warn",
                    "border-blue-500/20 bg-blue-500/5 text-blue-300": alert.level === "info",
                    "border-emerald-500/20 bg-emerald-500/5 text-emerald-300": alert.level === "ok",
                  })}>
                    <span className={cn("w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0", {
                      "bg-orange-400 animate-pulse": alert.level === "warn",
                      "bg-blue-400": alert.level === "info",
                      "bg-emerald-400": alert.level === "ok",
                    })} />
                    {alert.msg}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* News/Catalyst Strip */}
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">News & Catalysts</h3>
            </div>
            <div className="space-y-2">
              {mockNewsCatalysts.map((news) => (
                <div key={news.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0 group cursor-pointer hover:bg-primary/5 rounded px-2 -mx-2 transition-colors">
                  <span className={cn("mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 font-mono", news.sentiment === "bullish" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20")}>
                    {news.symbol}
                  </span>
                  <p className="text-xs text-foreground/80 group-hover:text-foreground transition-colors flex-1">{news.headline}</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 font-mono">{news.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* AI Daily Briefing */}
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-display font-semibold text-foreground">AI Daily Briefing</h3>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">GPT-4o</span>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p><span className="text-primary font-semibold">Bull thesis:</span> AI infrastructure spending remains robust. AVGO and NVDA driving semiconductor outperformance. Accumulation on dips remains the playbook.</p>
              <p><span className="text-orange-400 font-semibold">Watch:</span> Fed minutes Thursday — rate expectations have been stable. Any hawkish surprise could pressure growth names short-term.</p>
              <p><span className="text-emerald-400 font-semibold">Crypto:</span> BTC holding above key support. SUI showing unusual relative strength — potential breakout candidate.</p>
              <p><span className="text-blue-400 font-semibold">Nuclear/Defense:</span> SMR and KTOS remain long-term accumulation targets. No near-term catalysts but thesis intact.</p>
            </div>
          </motion.div>

          {/* Bot Status */}
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-display font-semibold text-foreground">Bot Status</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold tracking-wider">READ-ONLY</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "MooMoo Trader", status: "online", lastScan: "4m ago", scans: bots && 'moomoo' in bots ? (bots as any).moomoo?.scansToday ?? 47 : 47 },
                { name: "Crypto Hunter", status: "scanning", lastScan: "Just now", scans: bots && 'cryptoHunter' in bots ? (bots as any).cryptoHunter?.scansToday ?? 31 : 31 },
              ].map((bot, i) => (
                <div key={i} className="p-3 rounded-lg bg-background/60 border border-border/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{bot.name}</span>
                    <span className={cn("text-[10px] flex items-center gap-1 font-semibold", bot.status === "online" ? "text-emerald-400" : "text-blue-400")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", bot.status === "scanning" ? "bg-blue-400 animate-ping" : "bg-emerald-400")} />
                      {bot.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Last scan: {bot.lastScan}</span>
                    <span>{bot.scans} today</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Portfolio Breakdown */}
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">Portfolio Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Roth IRA", value: portfolioSummary?.rothIra ?? mockPortfolioData.rothIra.total, pct: 57, color: "bg-primary" },
                { label: "Individual", value: portfolioSummary?.individual ?? mockPortfolioData.individual.total, pct: 30, color: "bg-blue-500" },
                { label: "Crypto", value: portfolioSummary?.crypto ?? mockPortfolioData.crypto.total, pct: 13, color: "bg-emerald-500" },
              ].map((sleeve) => (
                <div key={sleeve.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{sleeve.label}</span>
                    <span className="font-mono text-foreground">${sleeve.value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sleeve.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className={cn("h-full rounded-full", sleeve.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
