import * as React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, LineChart, Radar, Bot, TerminalSquare,
  Briefcase, BookOpen, ShieldAlert, Settings, Menu, Search,
  Bell, Star, TrendingUp, TrendingDown, BarChart3, Coins, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMarketSession } from "@/hooks/use-market";

// ─── Sidebar shimmer keyframe (injected once) ─────────────────────────────────
const SHIMMER_STYLE = `
  @keyframes sidebar-rail-shimmer {
    0%   { transform: translateY(-200%); }
    100% { transform: translateY(600%);  }
  }
  @keyframes shimmer-right {
    0%   { transform: translateX(-200%); }
    100% { transform: translateX(400%);  }
  }
  @keyframes logo-ring-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes logo-ring-spin-rev {
    from { transform: rotate(360deg); }
    to   { transform: rotate(0deg); }
  }
  @keyframes logo-glow-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1.0); }
    50%       { opacity: 1.0;  transform: scale(1.10); }
  }
  @keyframes logo-core-pulse {
    0%, 100% { transform: scale(0.82); opacity: 0.70; }
    50%       { transform: scale(1.20); opacity: 1.0;  }
  }
  @keyframes orb-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orb-halo-pulse {
    0%, 100% { opacity: 0.50; transform: scale(1.0); }
    50%       { opacity: 0.90; transform: scale(1.15); }
  }
  @media (prefers-reduced-motion: reduce) {
    img[alt="Meridian orb"] { animation: none !important; }
  }
`;

// ─── Per-tab accent colors ────────────────────────────────────────────────────
// Gold remains the primary brand color; each tab gets a subtle accent variation.
const TAB_ACCENTS: Record<string, { beam: string; bg: string; border: string; text: string }> = {
  "Command Center": { beam: "linear-gradient(180deg,#F7E7B4,#D4AF37,#B8860B)", bg: "rgba(212,175,55,0.10)",  border: "rgba(212,175,55,0.18)", text: "#D4AF37" },
  "Markets":        { beam: "linear-gradient(180deg,#6EE7B7,#22C55E,#16A34A)", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.18)",  text: "#22C55E" },
  "Scanners":       { beam: "linear-gradient(180deg,#FDE68A,#F59E0B,#D97706)", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.18)", text: "#F59E0B" },
  "Research":       { beam: "linear-gradient(180deg,#F7E7B4,#D4AF37,#B8860B)", bg: "rgba(212,175,55,0.08)",  border: "rgba(212,175,55,0.14)", text: "#D4AF37" },
  "Portfolio":      { beam: "linear-gradient(180deg,#6EE7B7,#22C55E,#16A34A)", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.16)",  text: "#22C55E" },
  "Bots":           { beam: "linear-gradient(180deg,#5EEAD4,#14B8A6,#0D9488)", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.16)", text: "#14B8A6" },
  "Journal":        { beam: "linear-gradient(180deg,#F7E7B4,#D4AF37,#B8860B)", bg: "rgba(212,175,55,0.08)",  border: "rgba(212,175,55,0.14)", text: "#D4AF37" },
  "Watchlist":      { beam: "linear-gradient(180deg,#F7E7B4,#D4AF37,#B8860B)", bg: "rgba(212,175,55,0.10)",  border: "rgba(212,175,55,0.18)", text: "#D4AF37" },
  "Risk":           { beam: "linear-gradient(180deg,#FDE68A,#F59E0B,#D97706)", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.16)", text: "#F59E0B" },
  "Settings":       { beam: "linear-gradient(180deg,#CBD5E1,#94A3B8,#64748B)", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.12)", text: "#94A3B8" },
  "Stock Market":   { beam: "linear-gradient(180deg,#F7E7B4,#D4AF37,#22C55E)",  bg: "rgba(212,175,55,0.09)",  border: "rgba(212,175,55,0.18)",  text: "#D4AF37"  },
  "Crypto Market":  { beam: "linear-gradient(180deg,#67E8F9,#22D3EE,#14B8A6)",  bg: "rgba(20,184,166,0.10)",  border: "rgba(20,184,166,0.22)",  text: "#22D3EE"  },
};

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

// ─── Flyout chip data ─────────────────────────────────────────────────────────
type FlyoutData = { desc: string; chips: string[] };

const NAV_FLYOUTS: Record<string, FlyoutData> = {
  "Command Center": { desc: "AI-powered cross-market overview.",                          chips: ["Market Open", "AI Briefing", "Risk Online"]    },
  "Markets":        { desc: "Equities, ETFs, crypto, and index monitoring.",              chips: ["Equities", "Crypto", "Indices"]                },
  "Scanners":       { desc: "Momentum, breakout, pullback, and options discovery.",       chips: ["Momentum", "Breakout", "Pullback"]             },
  "Research":       { desc: "AI-assisted thesis, catalysts, sources, and summaries.",     chips: ["Catalysts", "Filings", "News"]                 },
  "Portfolio":      { desc: "Allocation, P&L, exposure, and account intelligence.",       chips: ["Allocation", "Gain/Loss", "Exposure"]          },
  "Bots":           { desc: "Read-only signal engines and observation systems.",          chips: ["MooMoo Bot", "Crypto Hunter", "Read-Only"]     },
  "Journal":        { desc: "Trade notes, entries, exits, and lessons.",                  chips: ["Entries", "Reviews", "Lessons"]                },
  "Watchlist":      { desc: "Tracked tickers, alerts, setups, and thesis monitoring.",    chips: ["Alerts", "Setups", "Thesis"]                   },
  "Risk":           { desc: "Drawdown, volatility, exposure, and protective alerts.",     chips: ["Drawdown", "Volatility", "Stops"]              },
  "Settings":       { desc: "Data sources, AI behavior, display, and system controls.",   chips: ["Sources", "Theme", "Controls"]                 },
};

// ─── Logo mark — teal/cyan energy ring ───────────────────────────────────────
function LogoMark({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", !expanded && "justify-center")}>
      <div className="relative flex-shrink-0 w-10 h-10">
        {/* Pulsing outer halo */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "-6px",
            background: "radial-gradient(circle, rgba(20,184,166,0.28) 0%, transparent 70%)",
            animation: "orb-halo-pulse 3s ease-in-out infinite",
          }}
        />
        {/* Spinning plasma orb image */}
        <img
          src="/meridian-orb.png"
          alt="Meridian orb"
          className="w-10 h-10 rounded-full object-cover"
          style={{
            animation: "orb-spin 12s linear infinite",
            filter: "drop-shadow(0 0 8px rgba(20,184,166,0.75)) drop-shadow(0 0 3px rgba(165,243,252,0.55))",
          }}
        />
      </div>

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
                background: "linear-gradient(135deg, #67E8F9 0%, #14B8A6 60%, #0D9488 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
            >YucaTanaTrades</span>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.18em] block">
              Meridian Intelligence
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Flyout panel ─────────────────────────────────────────────────────────────
function FlyoutPanel({ name, data }: { name: string; data: FlyoutData }) {
  const NavIcon  = navItems.find((n) => n.name === name)?.icon ?? LayoutDashboard;
  const accent   = TAB_ACCENTS[name] ?? TAB_ACCENTS["Command Center"]!;

  return (
    <div
      className="w-56 rounded-xl overflow-hidden"
      style={{
        background: "hsl(225 25% 7% / 0.97)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${accent.border}`,
        borderTopColor: accent.text + "55",
        boxShadow: `0 16px 48px rgba(0,0,0,0.65), 0 0 24px ${accent.bg}`,
      }}
    >
      {/* Accent top stripe */}
      <div className="h-[2px]" style={{ background: accent.beam }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
          >
            <NavIcon className="w-3.5 h-3.5" style={{ color: accent.text }} />
          </div>
          <span className="font-display font-semibold text-sm text-foreground">{name}</span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground/65 mb-3 leading-relaxed">{data.desc}</p>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          {data.chips.map((chip) => (
            <span
              key={chip}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                background: accent.bg,
                border: `1px solid ${accent.border}`,
                color: accent.text,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Markets flyout submenu ───────────────────────────────────────────────────
function MarketsSubmenu({ onNavigate }: { onNavigate: (path: string) => void }) {
  const stocksA = TAB_ACCENTS["Stock Market"]!;
  const cryptoA = TAB_ACCENTS["Crypto Market"]!;
  return (
    <div className="w-64 rounded-xl overflow-hidden"
      style={{
        background: "hsl(225 25% 7% / 0.97)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(212,175,55,0.20)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.65), 0 0 28px rgba(212,175,55,0.06)",
      }}>
      <div className="h-[2px]"
        style={{ background: "linear-gradient(90deg,#D4AF37 0%,#22D3EE 50%,#D4AF37 100%)" }} />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <LineChart className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-display font-semibold text-foreground">Markets</span>
          <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono uppercase tracking-widest">Select</span>
        </div>
        <button onClick={() => onNavigate("/markets/stocks")}
          className="w-full text-left rounded-lg p-3 transition-all hover:brightness-110 active:scale-[0.99]"
          style={{ background: stocksA.bg, border: `1px solid ${stocksA.border}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: stocksA.text }} />
            <span className="text-sm font-semibold" style={{ color: stocksA.text }}>Stock Market</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mb-2.5 leading-relaxed">
            Equities, ETFs, indices, sector flow · Delayed · Yahoo
          </p>
          <div className="flex gap-1 flex-wrap">
            {["SPY","QQQ","NVDA","MSFT"].map(c => (
              <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold"
                style={{ background: "rgba(212,175,55,0.12)", border: `1px solid ${stocksA.border}`, color: stocksA.text }}>
                {c}
              </span>
            ))}
          </div>
        </button>
        <button onClick={() => onNavigate("/markets/crypto")}
          className="w-full text-left rounded-lg p-3 transition-all hover:brightness-110 active:scale-[0.99]"
          style={{ background: cryptoA.bg, border: `1px solid ${cryptoA.border}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Coins className="w-3.5 h-3.5" style={{ color: cryptoA.text }} />
            <span className="text-sm font-semibold" style={{ color: cryptoA.text }}>Crypto Market</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mb-2.5 leading-relaxed">
            BTC, ETH, SOL, SUI · 24/7 market flow · Live · Kraken
          </p>
          <div className="flex gap-1 flex-wrap">
            {["BTC","ETH","SOL","SUI"].map(c => (
              <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold"
                style={{ background: "rgba(20,184,166,0.12)", border: `1px solid ${cryptoA.border}`, color: cryptoA.text }}>
                {c}
              </span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Markets inline nav item (with accordion sub-items) ───────────────────────
function MarketsNavItem({
  isSidebarOpen, location, showFlyout, hideFlyout,
}: {
  isSidebarOpen: boolean;
  location: string;
  showFlyout: (name: string, el: HTMLElement) => void;
  hideFlyout: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const isActive = location.startsWith("/markets");
  const isStocks = location === "/markets" || location === "/markets/stocks";
  const isCrypto = location === "/markets/crypto";
  const showSub  = isSidebarOpen && (hovered || isActive);

  const mktA    = TAB_ACCENTS["Markets"]!;
  const stocksA = TAB_ACCENTS["Stock Market"]!;
  const cryptoA = TAB_ACCENTS["Crypto Market"]!;

  return (
    <div className="space-y-0.5">
      <motion.div
        whileHover={{ x: isSidebarOpen ? 3 : 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={(e) => {
          setHovered(true);
          if (!isSidebarOpen) showFlyout("Markets", e.currentTarget);
        }}
        onMouseLeave={() => { setHovered(false); hideFlyout(); }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group relative overflow-hidden",
          "transition-all duration-200",
          isActive ? "" : "text-muted-foreground hover:text-foreground"
        )}
        style={isActive
          ? { background: mktA.bg, border: `1px solid ${mktA.border}`, color: mktA.text, boxShadow: `0 0 20px ${mktA.bg}` }
          : { border: "1px solid transparent" }
        }
      >
        {isActive && (
          <motion.div
            layoutId="activeBeam"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
            style={{ background: mktA.beam, animation: "active-beam-pulse 3s ease-in-out infinite" }}
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        {!isActive && (
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: "rgba(255,255,255,0.02)" }} />
        )}
        <motion.div whileHover={{ scale: 1.12 }} transition={{ duration: 0.15 }}
          className={cn("flex-shrink-0 transition-colors duration-200",
            isActive ? "" : "text-muted-foreground group-hover:text-foreground")}
          style={isActive ? { color: mktA.text } : {}}>
          <LineChart className="w-[18px] h-[18px]" />
        </motion.div>
        {isSidebarOpen && (
          <>
            <span className={cn("font-medium text-sm transition-colors duration-200 flex-1 min-w-0",
              isActive ? "" : "group-hover:text-foreground")}
              style={isActive ? { color: mktA.text } : {}}>
              Markets
            </span>
            <motion.div animate={{ rotate: showSub ? 90 : 0 }} transition={{ duration: 0.2 }}
              className="text-muted-foreground/35 flex-shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </>
        )}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute inset-y-0 w-1/2"
              style={{ backgroundImage: `linear-gradient(90deg,transparent,${mktA.text}18,transparent)`,
                animation: "shimmer-right 5s ease-in-out infinite" }} />
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showSub && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden pl-3"
          >
            <Link href="/markets/stocks">
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}
                className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                  isStocks ? "" : "text-muted-foreground hover:text-foreground")}
                style={isStocks
                  ? { background: stocksA.bg, border: `1px solid ${stocksA.border}` }
                  : { border: "1px solid transparent" }}>
                <BarChart3 className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: isStocks ? stocksA.text : undefined }} />
                <span className="text-xs font-medium flex-1"
                  style={{ color: isStocks ? stocksA.text : undefined }}>Stock Market</span>
                {isStocks && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: stocksA.text }} />
                )}
              </motion.div>
            </Link>
            <Link href="/markets/crypto">
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}
                className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                  isCrypto ? "" : "text-muted-foreground hover:text-foreground")}
                style={isCrypto
                  ? { background: cryptoA.bg, border: `1px solid ${cryptoA.border}` }
                  : { border: "1px solid transparent" }}>
                <Coins className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: isCrypto ? cryptoA.text : undefined }} />
                <span className="text-xs font-medium flex-1"
                  style={{ color: isCrypto ? cryptoA.text : undefined }}>Crypto Market</span>
                {isCrypto && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: cryptoA.text, boxShadow: `0 0 6px ${cryptoA.text}60` }} />
                )}
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI suggestions ───────────────────────────────────────────────────────────
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
  const [location, navigate] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [flyout, setFlyout]               = React.useState<{ name: string; top: number } | null>(null);
  const flyoutTimeout                     = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [searchValue, setSearchValue]     = React.useState("");
  const { data: session } = useMarketSession();
  const equitiesOpen = session?.equities?.isOpen ?? false;
  const statusLabel = equitiesOpen ? "DELAYED ~15m" : "MARKETS CLOSED";
  const statusColor = equitiesOpen ? "#D4AF37" : "#94A3B8";
  const statusBg = equitiesOpen ? "rgba(212,175,55,0.08)" : "rgba(148,163,184,0.08)";
  const statusBorder = equitiesOpen ? "rgba(212,175,55,0.18)" : "rgba(148,163,184,0.18)";

  const sidebarW = isSidebarOpen ? 240 : 64;

  const showFlyout = (name: string, el: HTMLElement) => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
    const rect = el.getBoundingClientRect();
    setFlyout({ name, top: rect.top });
  };
  const hideFlyout  = () => { flyoutTimeout.current = setTimeout(() => setFlyout(null), 200); };
  const keepFlyout  = () => { if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current); };

  React.useEffect(() => () => { if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current); }, []);

  return (
    <>
      {/* Inject keyframes (only once) */}
      <style>{SHIMMER_STYLE}</style>

      <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <motion.aside
          initial={{ width: 240 }}
          animate={{ width: sidebarW }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 flex flex-col z-20 relative overflow-visible"
          style={{
            background: "linear-gradient(180deg, hsl(225 28% 4%) 0%, hsl(225 25% 3.5%) 100%)",
            backdropFilter: "blur(16px)",
            borderRight: "1px solid rgba(212,175,55,0.12)",
            boxShadow: "inset -1px 0 0 rgba(212,175,55,0.06), 2px 0 24px rgba(0,0,0,0.4)",
          }}
        >
          {/* Vertical shimmer rail on right edge */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 bottom-0 w-px overflow-hidden pointer-events-none"
            style={{ zIndex: 30 }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1px",
                height: "30%",
                background: "linear-gradient(180deg,transparent 0%,rgba(212,175,55,0.35) 30%,rgba(212,175,55,0.65) 50%,rgba(212,175,55,0.35) 70%,transparent 100%)",
                animation: "sidebar-rail-shimmer 9s ease-in-out infinite",
                animationDelay: "1.5s",
              }}
            />
          </div>

          {/* Logo */}
          <div
            className="h-16 flex items-center px-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}
          >
            <LogoMark expanded={isSidebarOpen} />
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {(() => {
              const renderRow = (ni: typeof navItems[0]) => {
                const isActive = location === ni.href ||
                  (ni.href !== "/" && location.startsWith(ni.href));
                const accent = TAB_ACCENTS[ni.name] ?? TAB_ACCENTS["Command Center"]!;
                return (
                  <Link key={ni.name} href={ni.href}>
                    <motion.div
                      whileHover={{ x: isSidebarOpen ? 3 : 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      onMouseEnter={(e) => showFlyout(ni.name, e.currentTarget)}
                      onMouseLeave={hideFlyout}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group relative overflow-hidden",
                        "transition-all duration-200",
                        isActive ? "" : "text-muted-foreground hover:text-foreground"
                      )}
                      style={isActive
                        ? { background: accent.bg, border: `1px solid ${accent.border}`, color: accent.text, boxShadow: `0 0 20px ${accent.bg}` }
                        : { border: "1px solid transparent" }
                      }
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeBeam"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: accent.beam, animation: "active-beam-pulse 3s ease-in-out infinite" }}
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: "rgba(255,255,255,0.02)" }} />
                      )}
                      <motion.div whileHover={{ scale: 1.12 }} transition={{ duration: 0.15 }}
                        className={cn("flex-shrink-0 transition-colors duration-200",
                          isActive ? "" : "text-muted-foreground group-hover:text-foreground")}
                        style={isActive ? { color: accent.text } : {}}>
                        <ni.icon className="w-[18px] h-[18px]" />
                      </motion.div>
                      {isSidebarOpen && (
                        <span className={cn("font-medium text-sm transition-colors duration-200 flex-1 min-w-0",
                          isActive ? "" : "group-hover:text-foreground")}
                          style={isActive ? { color: accent.text } : {}}>
                          {ni.name}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                          <div className="absolute inset-y-0 w-1/2"
                            style={{ backgroundImage: `linear-gradient(90deg,transparent,${accent.text}18,transparent)`,
                              animation: "shimmer-right 5s ease-in-out infinite" }} />
                        </div>
                      )}
                    </motion.div>
                  </Link>
                );
              };

              const SectionLabel = ({ children }: { children: string }) => isSidebarOpen ? (
                <div className="px-3 pt-4 pb-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/25">
                    {children}
                  </span>
                </div>
              ) : <div className="pt-2" />;

              return (
                <>
                  <SectionLabel>Intelligence</SectionLabel>
                  {renderRow(navItems[0]!)}

                  <SectionLabel>Markets</SectionLabel>
                  <MarketsNavItem
                    isSidebarOpen={isSidebarOpen}
                    location={location}
                    showFlyout={showFlyout}
                    hideFlyout={hideFlyout}
                  />

                  <SectionLabel>Systems</SectionLabel>
                  {navItems.slice(2, 9).map(renderRow)}

                  <SectionLabel>Control</SectionLabel>
                  {renderRow(navItems[9]!)}
                </>
              );
            })()}
          </nav>

          {/* Bottom status */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <span className="ai-orb-sm" />
              {isSidebarOpen && (
                <span className="text-[9px] text-muted-foreground/45 uppercase tracking-[0.15em]">
                  All systems nominal
                </span>
              )}
            </div>
          </div>
        </motion.aside>

        {/* ── Flyout panels (fixed — escapes sidebar overflow) ──────────────── */}
        <AnimatePresence>
          {flyout && (flyout.name === "Markets" || !!NAV_FLYOUTS[flyout.name]) && (
            <motion.div
              key={flyout.name}
              style={{ position: "fixed", top: Math.max(8, flyout.top), left: sidebarW + 10, zIndex: 60 }}
              initial={{ opacity: 0, x: -12, filter: "blur(8px)"  }}
              animate={{ opacity: 1, x: 0,   filter: "blur(0px)"  }}
              exit={{ opacity: 0, x: -12, filter: "blur(8px)" }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={keepFlyout}
              onMouseLeave={hideFlyout}
            >
              {flyout.name === "Markets"
                ? <MarketsSubmenu onNavigate={(path) => { setFlyout(null); navigate(path); }} />
                : <FlyoutPanel name={flyout.name} data={NAV_FLYOUTS[flyout.name]!} />
              }
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <header
            className="h-16 flex-shrink-0 z-10 flex items-center justify-between px-4 gap-4"
            style={{
              background: "hsl(220 20% 4% / 0.88)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Sidebar toggle */}
              <Button
                variant="ghost" size="icon"
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

              {/* Premium AI search */}
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
                    boxShadow: "0 0 0 3px rgba(212,175,55,0.08),0 0 24px rgba(212,175,55,0.10)",
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
                        boxShadow: "0 16px 48px rgba(0,0,0,0.55),0 0 20px rgba(212,175,55,0.05)",
                      }}
                    >
                      <div className="px-3 py-2 border-b border-border/30">
                        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">AI Quick Commands</p>
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
              <div
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                style={{ background: statusBg, border: `1px solid ${statusBorder}`, color: statusColor }}
                title="Equity/ETF quotes are delayed ~15min (Yahoo). Crypto is reference data (CoinGecko)."
              >
                <span className="ai-orb-sm" style={{ background: statusColor }} />
                {statusLabel}
              </div>

              <Button variant="ghost" size="icon" className="relative group">
                <Bell className="w-5 h-5 group-hover:text-primary transition-colors duration-200" />
                <span
                  className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"
                  style={{ animation: "active-beam-pulse 2.5s ease-in-out infinite" }}
                />
              </Button>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,rgba(212,175,55,0.30),rgba(212,175,55,0.08))",
                  border: "1px solid rgba(212,175,55,0.30)",
                  color: "#D4AF37",
                }}
              >TX</div>
            </div>
          </header>

          {/* Page content with blur transitions */}
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
    </>
  );
}
