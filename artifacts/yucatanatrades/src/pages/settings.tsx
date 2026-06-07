import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, CheckCircle, XCircle, Wifi, WifiOff, Bell, Shield, Palette, Database, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CONNECTIONS = [
  { name: "MooMoo (Moomoo API)", status: "connected", icon: "📊", last: "Today 2:32 PM", mode: "READ-ONLY" },
  { name: "Crypto Hunter (Custom Bot)", status: "connected", icon: "🤖", last: "Today 2:28 PM", mode: "READ-ONLY" },
  { name: "Alpaca Markets", status: "disconnected", icon: "🦙", last: "Not connected", mode: "—" },
  { name: "Interactive Brokers", status: "disconnected", icon: "🏛️", last: "Not connected", mode: "—" },
  { name: "CoinGecko API", status: "connected", icon: "🦎", last: "Today 2:15 PM", mode: "Data feed" },
  { name: "OpenAI (Research AI)", status: "connected", icon: "🧠", last: "Today 1:00 PM", mode: "GPT-4o" },
];

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

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Connections, alerts, risk thresholds, and preferences</p>
      </motion.div>

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-display font-semibold text-foreground">API Connections</h2>
        </div>
        <div className="divide-y divide-border/30">
          {CONNECTIONS.map((conn, i) => (
            <motion.div
              key={conn.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors"
            >
              <span className="text-xl w-8 text-center flex-shrink-0">{conn.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{conn.name}</p>
                <p className="text-xs text-muted-foreground">{conn.last}</p>
              </div>
              <div className="flex items-center gap-2">
                {conn.mode !== "—" && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-bold", conn.mode === "READ-ONLY" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-300 border-blue-500/20")}>
                    {conn.mode}
                  </span>
                )}
                {conn.status === "connected" ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <button className="flex items-center gap-1 text-xs text-muted-foreground border border-border/50 px-2.5 py-1 rounded-lg hover:text-foreground hover:border-primary/30 transition-colors">
                    <WifiOff className="w-3 h-3" /> Connect
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-12 md:col-span-6 glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Notifications</h2>
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
