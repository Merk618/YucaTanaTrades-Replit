import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_METRICS = [
  { label: "Portfolio Beta", value: "1.42", status: "warn", note: "Elevated vs S&P 500" },
  { label: "Max Drawdown (YTD)", value: "-8.4%", status: "ok", note: "Within 15% limit" },
  { label: "Margin Usage", value: "0%", status: "ok", note: "No leverage used" },
  { label: "Crypto Allocation", value: "12.8%", status: "ok", note: "Below 20% limit" },
  { label: "Single-Name Concentration", value: "18.4%", status: "warn", note: "NVDA > 15% threshold" },
  { label: "Sector Concentration", value: "44%", status: "warn", note: "Tech/Semis combined" },
];

const ALERTS = [
  { severity: "warn", title: "NVDA Oversized", msg: "NVDA is 18.4% of portfolio — consider trimming if price > $950", date: "Jun 7" },
  { severity: "info", title: "Fed Meeting Impact", msg: "Rate decision on Jun 12 — high volatility expected, especially in rate-sensitive names", date: "Jun 6" },
  { severity: "warn", title: "BTC Funding Rate", msg: "Positive funding rate on BTC perpetuals — crowded long trade, risk of swift correction", date: "Jun 5" },
  { severity: "ok", title: "Portfolio Risk Score", msg: "Overall risk score 62/100 — well within acceptable parameters", date: "Jun 4" },
];

const POSITION_SIZING = [
  { ticker: "NVDA", allocation: 18.4, limit: 15, risk: "HIGH" },
  { ticker: "BTC", allocation: 8.2, limit: 15, risk: "LOW" },
  { ticker: "MSFT", allocation: 6.8, limit: 15, risk: "LOW" },
  { ticker: "AVGO", allocation: 6.0, limit: 15, risk: "LOW" },
  { ticker: "KTOS", allocation: 4.9, limit: 10, risk: "LOW" },
  { ticker: "ETH", allocation: 3.3, limit: 10, risk: "LOW" },
  { ticker: "ASTS", allocation: 2.8, limit: 5, risk: "OK" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  return <TrendingDown className="w-4 h-4 text-red-400" />;
}

export default function Risk() {
  const overallRisk = RISK_METRICS.filter((m) => m.status !== "ok").length;
  const overallStatus = overallRisk === 0 ? "ok" : overallRisk <= 2 ? "moderate" : "high";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Risk Manager</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Portfolio risk metrics, alerts, and position sizing analysis</p>
      </motion.div>

      {/* Overall risk banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={cn("glass-card p-5 border-l-4", {
          "border-l-emerald-500": overallStatus === "ok",
          "border-l-orange-400": overallStatus === "moderate",
          "border-l-red-500": overallStatus === "high",
        })}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Overall Risk Level</p>
            <p className={cn("text-2xl font-display font-bold capitalize", {
              "text-emerald-400": overallStatus === "ok",
              "text-orange-400": overallStatus === "moderate",
              "text-red-400": overallStatus === "high",
            })}>
              {overallStatus === "moderate" ? "Moderate Risk" : overallStatus === "ok" ? "Low Risk" : "High Risk"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{overallRisk} metric{overallRisk !== 1 ? "s" : ""} outside target thresholds</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
            <p className="font-mono text-4xl font-bold text-foreground">62<span className="text-xl text-muted-foreground">/100</span></p>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "62%" }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-400 to-red-500"
              style={{ backgroundSize: "300% 100%", backgroundPosition: "38% 0" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Low</span><span>Moderate</span><span>High</span>
          </div>
        </div>
      </motion.div>

      {/* Risk metrics grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {RISK_METRICS.map((metric, i) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</p>
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
                  "bg-blue-400": alert.severity === "info",
                  "bg-emerald-400": alert.severity === "ok",
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
            <p className="text-[11px] text-muted-foreground mt-0.5">vs max allocation targets</p>
          </div>
          <div className="p-4 space-y-3">
            {POSITION_SIZING.map((pos, i) => (
              <div key={pos.ticker}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{pos.ticker}</span>
                    {pos.allocation > pos.limit && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">OVER</span>
                    )}
                  </div>
                  <span className={cn("font-mono text-xs font-semibold", pos.allocation > pos.limit ? "text-orange-400" : "text-foreground")}>
                    {pos.allocation}%
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
