import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, CheckCircle, Bell, Shield, ChevronRight, RefreshCw,
  Clock, KeyRound, Plug, AlertTriangle, Ban, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSourceHealth } from "@/hooks/use-market";
import type { ProviderStatus } from "@workspace/api-client-react";

// Map a provider health status to an honest visual treatment.
// We only ever show an affirmative "reachable" state when a real probe succeeded.
function statusView(p: ProviderStatus): {
  label: string; color: string; Icon: typeof CheckCircle; positive: boolean;
} {
  switch (p.status) {
    case "connected":
      return { label: "Connected", color: "#22C55E", Icon: CheckCircle, positive: true };
    case "delayed":
      return { label: "Reachable · Delayed", color: "#34d399", Icon: Clock, positive: true };
    case "read_only":
      return { label: "Connected · Read-only", color: "#22C55E", Icon: CheckCircle, positive: true };
    case "missing_api_key":
      return { label: "API key required", color: "#94a3b8", Icon: KeyRound, positive: false };
    case "auth_failed":
      return { label: "Auth failed", color: "#f87171", Icon: Ban, positive: false };
    case "health_check_failed":
      return { label: "Health check failed", color: "#f87171", Icon: AlertTriangle, positive: false };
    case "rate_limited":
      return { label: "Rate limited", color: "#fb923c", Icon: AlertTriangle, positive: false };
    case "stale":
      return { label: "Stale", color: "#fb923c", Icon: AlertTriangle, positive: false };
    case "future_ready":
      return { label: "Future-ready", color: "#60a5fa", Icon: Sparkles, positive: false };
    case "disabled":
      return { label: "Disabled", color: "#94a3b8", Icon: Ban, positive: false };
    default:
      return { label: "Not connected", color: "#94a3b8", Icon: Plug, positive: false };
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "Never";
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

const NOTIFICATION_SETTINGS = [
  { label: "Bot Signal Alerts", desc: "Notify when a bot detects a trading signal", on: true },
  { label: "Risk Threshold Breached", desc: "Alert when a position exceeds size limit", on: true },
  { label: "Price Alerts", desc: "Custom ticker price level alerts", on: true },
  { label: "Journal Reminder", desc: "Daily reminder to log your trades", on: false },
  { label: "Weekly Summary Email", desc: "Performance summary every Sunday", on: false },
];

const RISK_SETTINGS = [
  { label: "Max Single Position", value: "15%", desc: "Triggers alert when exceeded" },
  { label: "Max Sector Concentration", value: "40%", desc: "Per sector limit" },
  { label: "Max Drawdown Alert", value: "15%", desc: "From recent highs" },
  { label: "Crypto Allocation Limit", value: "20%", desc: "Of total portfolio" },
];

export default function SettingsPage() {
  const [notifs, setNotifs] = useState(NOTIFICATION_SETTINGS.map((n) => n.on));
  const { data: health, isLoading, isError, refetch, isFetching } = useSourceHealth();

  const providers = health?.providers ?? [];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Live data sources, alerts, risk thresholds, and preferences</p>
      </motion.div>

      {/* Data Sources — REAL health */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Data Sources</h2>
            <span className="text-[10px] text-muted-foreground/60">
              Status reflects real health checks{health ? ` · updated ${timeAgo(health.asOf)}` : ""}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/50 px-2.5 py-1 rounded-lg hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} /> Re-check
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground/60">Running health checks…</div>
        ) : isError ? (
          <div className="p-6 text-center text-xs text-red-400/80">Unable to reach the health endpoint.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {providers.map((p, i) => {
              const v = statusView(p);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-4 p-4 hover:bg-primary/5 transition-colors"
                >
                  <v.Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: v.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground font-mono">
                        {p.sourceLabel}
                      </span>
                      {p.isTradingCapable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-red-500/10 text-red-400 border-red-500/20">
                          READ-ONLY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground/60">
                        {p.assetClasses.join(" · ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        Checked {timeAgo(p.lastCheckedAt)}
                        {p.latencyMs != null ? ` · ${p.latencyMs}ms` : ""}
                      </span>
                      {p.envVars.length > 0 && !v.positive && (
                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                          needs {p.envVars.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                    style={{ color: v.color }}
                  >
                    {v.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="p-3 border-t border-border/40 bg-background/40">
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Equity & ETF quotes are <span className="text-foreground/80">delayed ~15 min</span> via Yahoo;
            crypto is reference pricing via CoinGecko. Trading-capable providers are wired
            <span className="text-red-400/90"> read-only</span> — no live order execution. AI providers
            power research only and are never used as a price source. API keys live on the server and
            never reach the browser.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-12 md:col-span-6 glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Notifications</h2>
            <span className="text-[10px] text-muted-foreground/50">Local preferences</span>
          </div>
          <div className="divide-y divide-border/30">
            {NOTIFICATION_SETTINGS.map((n, i) => (
              <div key={n.label} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
                <button
                  onClick={() => setNotifs((prev) => prev.map((v, j) => j === i ? !v : v))}
                  className={cn("relative w-10 h-5 rounded-full transition-colors flex-shrink-0", notifs[i] ? "bg-primary" : "bg-muted")}
                >
                  <motion.div
                    animate={{ x: notifs[i] ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk thresholds */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="col-span-12 md:col-span-6 glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Risk Thresholds</h2>
            <span className="text-[10px] text-muted-foreground/50">Local preferences</span>
          </div>
          <div className="divide-y divide-border/30">
            {RISK_SETTINGS.map((r) => (
              <div key={r.label} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{r.value}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* App info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">YT</span>
              </div>
              <h3 className="font-display font-bold text-foreground">YucaTanaTrades</h3>
              <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground">Premium AI-powered trading intelligence terminal</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground">All bots operate in <span className="text-red-400 font-semibold">READ-ONLY</span> mode</p>
            <p className="text-xs text-muted-foreground">No live trade execution permitted</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
