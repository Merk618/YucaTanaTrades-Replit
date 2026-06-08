import * as React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, LineChart, Radar, Bot, TerminalSquare,
  Briefcase, BookOpen, ShieldAlert, Settings, Menu, Search,
  Bell, Star, TrendingUp, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Nav configuration ───────────────────────────────────────────────────────
const navItems = [
  { name: "Command Center", href: "/",          icon: LayoutDashboard },
  { name: "Markets",        href: "/markets",   icon: LineChart        },
  { name: "Scanners",       href: "/scanners",  icon: Radar            },
  { name: "Research",       href: "/research",  icon: TerminalSquare   },
  { name: "Portfolio",      href: "/portfolio", icon: Briefcase        },
  { name: "Bots",           href: "/bots",      icon: Bot              },
  { name: "Journal",        href: "/journal",   icon: BookOpen         },
  { name: "Watchlist",      href: "/watchlist", icon: Star             },
  { name: "Risk",           href: "/risk",      icon: ShieldAlert      },
  { name: "Settings",       href: "/settings",  icon: Settings         },
];

// ─── Flyout data ─────────────────────────────────────────────────────────────
type Metric = { label: string; value: string; up?: boolean };
type FlyoutData = { desc: string; metrics: Metric[] };

const NAV_FLYOUTS: Record<string, FlyoutData> = {
  "Command Center": {
    desc: "AI-powered market intelligence hub",
    metrics: [
      { label: "Portfolio",  value: "$221,770", up: true  },
      { label: "Day P&L",   value: "+$1,180",  up: true  },
    ],
  },
  "Markets": {
    desc: "Live equities, ETFs, crypto, and indices",
    metrics: [
      { label: "SPY", value: "+0.23%", up: true  },
      { label: "QQQ", value: "+0.52%", up: true  },
      { label: "BTC", value: "+1.87%", up: true  },
    ],
  },
  "Scanners": {
    desc: "Momentum, breakout, pullback, and options-ready setups",
    metrics: [
      { label: "Top signal",    value: "ASTS"  },
      { label: "Signals today", value: "247"   },
      { label: "Avg score",     value: "84.2"  },
    ],
  },
  "Research": {
    desc: "AI-assisted market research, catalysts, and summaries",
    metrics: [
      { label: "Reports ready", value: "12"     },
      { label: "AI model",      value: "GPT-4o" },
    ],
  },
  "Portfolio": {
    desc: "Allocation, P&L, risk exposure, and account intelligence",
    metrics: [
      { label: "Total value", value: "$221,770",  up: true },
      { label: "All-time",    value: "+23.6%",    up: true },
    ],
  },
  "Bots": {
    desc: "Read-only strategy bots, observations, and signal engines",
    metrics: [
      { label: "Active bots", value: "2 / 2",   up: true },
      { label: "Mode",        value: "READ-ONLY"          },
    ],
  },
  "Journal": {
    desc: "Trade history, lessons, entries, exits, and reviews",
    metrics: [
      { label: "Entries",  value: "10"  },
      { label: "Win rate", value: "64%" },
    ],
  },
  "Watchlist": {
    desc: "Tracked tickers, alerts, setups, and thesis monitoring",
    metrics: [
      { label: "Watching",       value: "15" },
      { label: "High priority",  value: "5"  },
    ],
  },
  "Risk": {
    desc: "Exposure, drawdown, volatility, and position sizing",
    metrics: [
      { label: "Risk score", value: "62/100" },
      { label: "Alerts",     value: "2"      },
    ],
  },
  "Settings": {
    desc: "API connections, preferences, AI behavior, and controls",
    metrics: [],
  },
};

// ─── LogoMark ─────────────────────────────────────────────────────────────────
function LogoMark({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", !expanded && "justify-center")}>
      {/* Animated monogram */}
      <div className="relative flex-shrink-0 w-10 h-10">
        {/* Outer rotating ring (CSS-driven) */}
        <div
          className="absolute inset-0"
          style={{ animation: "ring-rotate 18s linear infinite", transformOrigin: "center" }}
        >
          <svg viewBox="0 0 40 40" className="w-10 h-10">
            {/* Full circle baseline */}
            <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(212,175,55,0.14)" strokeWidth="1" />
            {/* Animated arc segments */}
            <circle
              cx="20" cy="20" r="17"
              fill="none"
              stroke="rgba(212,175,55,0.65)"
              strokeWidth="1.5"
              strokeDasharray="9 51"
              strokeLinecap="round"
            />
          </svg>
          {/* Orbiting gold dot — positioned at top of ring, rotates with it */}
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{
              top: "1px",
              left: "calc(50% - 4px)",
              background: "radial-gradient(circle, #F5D76E, #D4AF37)",
              boxShadow: "0 0 6px rgba(212,175,55,0.9)",
            }}
          />
        </div>

        {/* Glass "YT" container — stays still */}
        <div
          className="absolute inset-[5px] rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.16) 0%, rgba(8,10,20,0.85) 100%)",
            border: "1px solid rgba(212,175,55,0.35)",
            boxShadow: "0 0 20px rgba(212,175,55,0.10), inset 0 1px 0 rgba(212,175,55,0.22)",
          }}
        >
          <span
            className="font-display font-bold text-xs leading-none select-none"
            style={{
              background: "linear-gradient(135deg, #F7E7B4 0%, #D4AF37 50%, #B8860B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            YT
          </span>
        </div>
      </div>

      {/* Brand text */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-shrink-0"
          >
            <span
              className="font-display font-bold text-base tracking-tight block leading-tight"
              style={{
                background: "linear-gradient(135deg, #F7E7B4 0%, #D4AF37 60%, #E8C84A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              YucaTana
            </span>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.18em] block">
              AI Market Intelligence
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Flyout panel ─────────────────────────────────────────────────────────────
function FlyoutPanel({ name, data }: { name: string; data: FlyoutData }) {
  const NavIcon = navItems.find((n) => n.name === name)?.icon ?? LayoutDashboard;
  return (
    <div
      className="w-56 rounded-xl p-4"
      style={{
        background: "hsl(225 25% 8% / 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(212,175,55,0.20)",
        borderTopColor: "rgba(212,175,55,0.30)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(212,175,55,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.20)" }}>
          <NavIcon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-display font-semibold text-sm text-foreground">{name}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mb-3 leading-relaxed">{data.desc}</p>
      {data.metrics.length > 0 && (
        <div className="border-t border-border/40 pt-2.5 space-y-1.5">
          {data.metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{m.label}</span>
              <span className={cn(
                "font-mono text-xs font-semibold",
                m.up === true ? "text-emerald-400" : m.up === false ? "text-red-400" : "text-primary"
              )}>
                {m.up === true && <TrendingUp className="w-2.5 h-2.5 inline mr-1 mb-0.5" />}
                {m.up === false && <TrendingDown className="w-2.5 h-2.5 inline mr-1 mb-0.5" />}
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI suggestion items ──────────────────────────────────────────────────────
const AI_SUGGESTIONS = [
  { icon: "⚡", label: "NVDA research"          },
  { icon: "📊", label: "Top momentum setups"    },
  { icon: "🛡️", label: "Portfolio risk"         },
  { icon: "🤖", label: "AI briefing summary"    },
  { icon: "🔍", label: "Options flow today"     },
  { icon: "🪙", label: "Crypto strength signal" },
];

// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [flyout, setFlyout] = React.useState<{ name: string; top: number } | null>(null);
  const flyoutTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const sidebarW = isSidebarOpen ? 240 : 64;

  const showFlyout = (name: string, el: HTMLElement) => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
    const rect = el.getBoundingClientRect();
    setFlyout({ name, top: rect.top });
  };
  const hideFlyout = () => {
    flyoutTimeout.current = setTimeout(() => setFlyout(null), 200);
  };
  const keepFlyout = () => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
  };

  React.useEffect(() => () => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: sidebarW }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex-shrink-0 border-r flex flex-col z-20 relative overflow-visible"
        style={{
          borderColor: "rgba(212,175,55,0.12)",
          background: "hsl(225 25% 4% / 0.97)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Logo area */}
        <div
          className="h-16 flex items-center px-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.10)" }}
        >
          <LogoMark expanded={isSidebarOpen} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((navItem) => {
            const isActive =
              location === navItem.href ||
              (navItem.href !== "/" && location.startsWith(navItem.href));

            return (
              <Link key={navItem.name} href={navItem.href}>
                <motion.div
                  whileHover={{ x: isSidebarOpen ? 3 : 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={(e) => showFlyout(navItem.name, e.currentTarget)}
                  onMouseLeave={hideFlyout}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group relative overflow-hidden",
                    "transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    isActive
                      ? {
                          background: "rgba(212,175,55,0.10)",
                          border: "1px solid rgba(212,175,55,0.18)",
                          boxShadow: "0 0 20px rgba(212,175,55,0.04)",
                        }
                      : {
                          border: "1px solid transparent",
                        }
                  }
                >
                  {/* Active left beam */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBeam"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full active-nav-beam"
                      style={{ background: "linear-gradient(180deg, #F5D76E, #D4AF37, #B8860B)" }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.12 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "flex-shrink-0 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <navItem.icon className="w-[18px] h-[18px]" />
                  </motion.div>

                  {/* Label */}
                  {isSidebarOpen && (
                    <span className={cn(
                      "font-medium text-sm transition-colors duration-200 flex-1 min-w-0",
                      isActive ? "text-primary" : "group-hover:text-foreground"
                    )}>
                      {navItem.name}
                    </span>
                  )}

                  {/* Active shimmer sweep */}
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                      <div
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/8 to-transparent"
                        style={{ animation: "shimmer-right 5s ease-in-out infinite" }}
                      />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <span className="ai-orb-sm" />
            {isSidebarOpen && (
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.15em]">
                All systems nominal
              </span>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Flyout panel (fixed — escapes sidebar overflow) ─────────────────── */}
      <AnimatePresence>
        {flyout && NAV_FLYOUTS[flyout.name] && (
          <motion.div
            key={flyout.name}
            style={{
              position: "fixed",
              top: Math.max(8, flyout.top),
              left: sidebarW + 8,
              zIndex: 60,
            }}
            initial={{ opacity: 0, x: -10, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0,   filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={keepFlyout}
            onMouseLeave={hideFlyout}
          >
            <FlyoutPanel name={flyout.name} data={NAV_FLYOUTS[flyout.name]!} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top header */}
        <header
          className="h-16 flex-shrink-0 z-10 flex items-center justify-between px-4 gap-4"
          style={{
            background: "hsl(220 20% 4% / 0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <motion.div
                animate={{ rotate: isSidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Menu className="w-5 h-5" />
              </motion.div>
            </Button>

            {/* Premium AI search bar */}
            <div className={cn(
              "relative hidden md:block transition-all duration-300",
              searchFocused ? "flex-1 max-w-lg" : "w-72"
            )}>
              <Search
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 pointer-events-none",
                  searchFocused ? "text-primary" : "text-muted-foreground"
                )}
              />
              <input
                type="text"
                placeholder="Search tickers, commands, research, or strategies…"
                className={cn(
                  "w-full rounded-lg pl-9 pr-12 py-2 text-sm font-mono outline-none transition-all duration-300",
                  searchFocused
                    ? "bg-card/70 border border-primary/45"
                    : "bg-muted/40 border border-border/40 hover:border-border/70"
                )}
                style={searchFocused ? {
                  boxShadow: "0 0 0 3px rgba(212,175,55,0.08), 0 0 24px rgba(212,175,55,0.10)",
                } : {}}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 pointer-events-none">
                ⌘K
              </div>

              {/* AI suggestion dropdown */}
              <AnimatePresence>
                {searchFocused && !searchValue && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                    style={{
                      background: "hsl(225 22% 8% / 0.97)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(212,175,55,0.18)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 20px rgba(212,175,55,0.05)",
                    }}
                  >
                    <div className="px-3 py-2 border-b border-border/30">
                      <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
                        AI Quick Commands
                      </p>
                    </div>
                    <div className="p-1.5">
                      {AI_SUGGESTIONS.map((s, i) => (
                        <motion.button
                          key={s.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm flex-shrink-0">{s.icon}</span>
                          <span className="font-mono text-xs">{s.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Market status pill */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.18)",
                color: "#22C55E",
              }}
            >
              <span className="ai-orb-sm" style={{ background: "#22C55E" }} />
              LIVE
            </div>

            {/* Bell */}
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="w-5 h-5 group-hover:text-primary transition-colors duration-200" />
              <span
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animation: "active-beam-pulse 2.5s ease-in-out infinite" }}
              />
            </Button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.30), rgba(212,175,55,0.08))",
                border: "1px solid rgba(212,175,55,0.30)",
                color: "#D4AF37",
              }}
            >
              TX
            </div>
          </div>
        </header>

        {/* Page content with blur-in transitions */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(5px)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="h-full max-w-[1600px] mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
