import { motion } from "framer-motion";
import { Bot, Shield, Activity, Clock, Scan, AlertTriangle, CheckCircle, WifiOff } from "lucide-react";
import { useGetBotsStatus } from "@workspace/api-client-react";
import { mockBotStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

const LOG_ENTRIES = [
  { time: "14:32:01", bot: "MooMoo", event: "Scan complete — 847 stocks screened", type: "info" },
  { time: "14:28:14", bot: "CryptoHunter", event: "Signal detected: BTC momentum building above MA20", type: "signal" },
  { time: "14:25:00", bot: "MooMoo", event: "No trades executed — conditions not met", type: "info" },
  { time: "14:20:33", bot: "CryptoHunter", event: "SOL breakout alert — monitoring confirmation", type: "signal" },
  { time: "14:15:00", bot: "MooMoo", event: "Scan complete — KTOS flagged as oversold candidate", type: "signal" },
  { time: "14:10:02", bot: "CryptoHunter", event: "Routine scan — no signals", type: "info" },
  { time: "14:05:00", bot: "MooMoo", event: "Market hours active — trading enabled", type: "ok" },
  { time: "09:30:00", bot: "MooMoo", event: "Bot initialized — read-only mode confirmed", type: "ok" },
];

const OBS_ENTRIES = [
  { ticker: "ASTS", setup: "Cup & Handle", entryAlert: "$22.15", target: "$28.00", stop: "$19.50", status: "watching" },
  { ticker: "SMR", setup: "Accumulation Zone", entryAlert: "$18.50–19.50", target: "$25.00", stop: "$16.00", status: "watching" },
  { ticker: "CLSK", setup: "Momentum Breakout", entryAlert: "$17.00", target: "$22.00", stop: "$15.20", status: "triggered" },
  { ticker: "QUBT", setup: "Catalyst Play", entryAlert: "$7.00", target: "$12.00", stop: "$5.80", status: "watching" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: typeof CheckCircle }> = {
    online: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
    scanning: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Scan },
    offline: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: WifiOff },
    idle: { color: "text-muted-foreground bg-muted/10 border-border/20", icon: Clock },
  };
  const cfg = map[status] ?? map.idle;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.color)}>
      <Icon className="w-3 h-3" />
      {status.toUpperCase()}
    </span>
  );
}

export default function Bots() {
  const { data: botsData } = useGetBotsStatus();

  const moomoo = botsData?.moomoo ?? { name: "MooMoo Stock Trader Bot", status: "online", lastScan: "4 min ago", scansToday: 47, isReadOnly: true, lastResult: "No signals — market conditions not optimal", health: "good" };
  const crypto = botsData?.cryptoHunter ?? { name: "Crypto Hunter Bot", status: "scanning", lastScan: "Just now", scansToday: 31, isReadOnly: true, lastResult: "BTC momentum building — monitoring for breakout confirmation", health: "good" };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Trading Bots</h1>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold tracking-widest">
              READ-ONLY MODE — No live trades executed
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm ml-8">All bots operate in observation mode only. Zero execution authority.</p>
      </motion.div>

      {/* Bot Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { bot: moomoo, icon: "🤖", accentColor: "border-primary/30 shadow-primary/10" },
          { bot: crypto, icon: "🪙", accentColor: "border-blue-500/30 shadow-blue-500/10" },
        ].map(({ bot, icon, accentColor }, i) => (
          <motion.div
            key={bot.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("glass-card p-6 shadow-lg scan-effect", accentColor)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-xl">{icon}</div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{bot.name}</h3>
                  <p className="text-xs text-muted-foreground">Automated scanner — read-only</p>
                </div>
              </div>
              <StatusPill status={bot.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Last Scan", value: bot.lastScan ?? "—" },
                { label: "Scans Today", value: String(bot.scansToday) },
                { label: "Health", value: bot.health ?? "good" },
                { label: "Mode", value: bot.isReadOnly ? "READ-ONLY" : "ACTIVE" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-lg bg-background/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <p className={cn("font-mono text-sm font-semibold", stat.label === "Mode" ? "text-red-400" : "text-foreground")}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-background/60 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Result</p>
              <p className="text-xs text-foreground/80">{bot.lastResult ?? "No recent result"}</p>
            </div>

            {/* Health bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>System Health</span>
                <span className={bot.health === "good" ? "text-emerald-400" : "text-orange-400"}>{bot.health === "good" ? "NOMINAL" : "WARNING"}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: bot.health === "good" ? "94%" : "60%" }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className={cn("h-full rounded-full", bot.health === "good" ? "bg-emerald-500" : "bg-orange-500")}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Observation Ledger */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-display font-semibold text-primary">Observation Ledger</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Bot-identified setups being monitored — no execution</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Ticker", "Setup", "Entry Alert", "Target", "Stop", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OBS_ENTRIES.map((row, i) => (
                <motion.tr key={row.ticker} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{row.ticker}</td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{row.setup}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{row.entryAlert}</td>
                  <td className="px-4 py-3 font-mono text-xs text-emerald-400">{row.target}</td>
                  <td className="px-4 py-3 font-mono text-xs text-red-400">{row.stop}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", row.status === "triggered" ? "bg-primary/15 text-primary border-primary/25" : "bg-muted text-muted-foreground border-border")}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bot Logs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden scan-effect">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-display font-semibold text-primary">Bot Activity Log</h2>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/50 border border-border/40">LIVE STREAM</span>
        </div>
        <div className="p-4 space-y-2 font-mono text-xs max-h-64 overflow-y-auto">
          {LOG_ENTRIES.map((log, i) => (
            <div key={i} className={cn("flex items-start gap-3 py-1.5 px-2 rounded transition-colors", log.type === "signal" ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/30")}>
              <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums">{log.time}</span>
              <span className={cn("flex-shrink-0 px-1.5 rounded text-[10px] font-bold", {
                "text-blue-400 bg-blue-500/10": log.bot === "CryptoHunter",
                "text-primary bg-primary/10": log.bot === "MooMoo",
              })}>{log.bot}</span>
              <span className={cn(log.type === "signal" ? "text-primary" : log.type === "ok" ? "text-emerald-400" : "text-foreground/70")}>
                {log.event}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
