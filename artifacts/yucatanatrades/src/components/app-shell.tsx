import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  ChartCandlestick,
  ChevronDown,
  CircleUserRound,
  Command,
  Home,
  LineChart,
  Newspaper,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motionTokens } from "@/lib/motion";

const topRoutes = [
  { label: "Overview", href: "/" },
  { label: "Markets", href: "/markets" },
  { label: "Charts", href: "/charts" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Research", href: "/research" },
  { label: "News", href: "/news" },
  { label: "AI Hub", href: "/ai-lab" },
] as const;

const railRoutes = [
  { label: "Overview", href: "/", icon: Home },
  { label: "Markets", href: "/markets", icon: LineChart },
  { label: "Charts", href: "/charts", icon: ChartCandlestick },
  { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Research", href: "/research", icon: BookOpen },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "AI Intelligence", href: "/ai-lab", icon: Bot },
] as const;

const commandItems = [
  { label: "Open market overview", detail: "Analytical route", href: "/markets", icon: LineChart },
  { label: "Open chart workspace", detail: "Historical · Demo", href: "/charts", icon: ChartCandlestick },
  { label: "Review portfolio", detail: "Demo snapshot · provider-neutral", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Open AI Intelligence", detail: "AI provider unavailable", href: "/ai-lab", icon: Sparkles },
] as const;

function isRouteActive(location: string, href: string) {
  if (href === "/") return location === "/";
  return location === href || location.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <svg className="yt-brand-mark" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M10 12.5c6 1.4 9.8 5.6 11.7 11.5M34 12.5c-6 1.4-9.8 5.6-11.7 11.5" />
      <path d="M22 12v21" />
      <path d="M10 20c5.7 1.2 9.2 5.1 11.8 10.5M34 20c-5.7 1.2-9.2 5.1-11.8 10.5" />
    </svg>
  );
}

function RailLink({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link href={href} className="yt-rail-link" aria-label={label} aria-current={active ? "page" : undefined}>
      {active && (
        <motion.span
          layoutId="yt-active-route"
          className="yt-rail-active"
          transition={motionTokens.spring.snappy}
        />
      )}
      <Icon aria-hidden="true" />
      <span className="yt-rail-tooltip" role="tooltip">{label}</span>
    </Link>
  );
}

function CommandPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const filteredItems = commandItems.filter((item) =>
    `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()),
  );

  const submitSelection = (event: React.FormEvent) => {
    event.preventDefault();
    const selected = filteredItems[selectedIndex] ?? filteredItems[0];
    if (selected) onNavigate(selected.href);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredItems.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % filteredItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + filteredItems.length) % filteredItems.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = filteredItems[selectedIndex] ?? filteredItems[0];
      if (selected) onNavigate(selected.href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="yt-command-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.06 : motionTokens.duration.fast }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            className="yt-command-palette"
            role="dialog"
            aria-modal="true"
            aria-labelledby="yt-command-title"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.985 }}
            transition={reducedMotion ? { duration: 0.06 } : motionTokens.spring.panel}
          >
            <form className="yt-command-input-row" onSubmit={submitSelection}>
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="yt-command-input" id="yt-command-title">Global search</label>
              <input
                id="yt-command-input"
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                aria-controls="yt-command-results"
                aria-activedescendant={filteredItems.length ? `yt-command-result-${selectedIndex}` : undefined}
                placeholder="Search markets, tickers, strategies, or ask AI..."
                autoComplete="off"
              />
              <button type="button" className="yt-icon-button" onClick={onClose} aria-label="Close search">
                <X aria-hidden="true" />
              </button>
            </form>
            <div className="yt-command-meta">
              <span>UI preview commands</span>
              <span>AI answers unavailable</span>
            </div>
            <div id="yt-command-results" className="yt-command-results" role="listbox" aria-label="Search results">
              {filteredItems.length ? filteredItems.map((item, index) => (
                <button
                  id={`yt-command-result-${index}`}
                  key={item.href}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  className="yt-command-result"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => onNavigate(item.href)}
                >
                  <span className="yt-command-result-icon"><item.icon aria-hidden="true" /></span>
                  <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <kbd>{index === selectedIndex ? "Enter" : ""}</kbd>
                </button>
              )) : (
                <div className="yt-command-empty">
                  No matching preview route. Market and AI lookup is unavailable in UI-1.
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    const updateVisibility = () => {
      document.documentElement.classList.toggle("yt-motion-paused", document.hidden);
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const goTo = (href: string) => {
    setCommandOpen(false);
    navigate(href);
  };

  return (
    <div className="yt-app">
      <motion.aside
        className="yt-icon-rail"
        aria-label="Primary navigation"
        initial={reducedMotion ? false : { opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reducedMotion ? { duration: 0 } : motionTokens.spring.panel}
      >
        <Link href="/" className="yt-rail-brand" aria-label="YucaTanaTrades overview">
          <BrandMark />
        </Link>
        <nav className="yt-rail-routes">
          {railRoutes.map((item) => (
            <RailLink key={item.href} {...item} active={isRouteActive(location, item.href)} />
          ))}
          <button className="yt-rail-link" type="button" disabled aria-label="Learning deferred">
            <BookOpen aria-hidden="true" />
            <span className="yt-rail-tooltip" role="tooltip">Learning · Deferred</span>
          </button>
        </nav>
        <div className="yt-rail-utilities">
          <RailLink
            label="Settings"
            href="/settings"
            icon={Settings}
            active={isRouteActive(location, "/settings")}
          />
          <button className="yt-rail-link" type="button" disabled aria-label="Account unavailable">
            <CircleUserRound aria-hidden="true" />
            <span className="yt-rail-tooltip" role="tooltip">Account · Unavailable</span>
          </button>
        </div>
      </motion.aside>

      <div className="yt-shell-column">
        <motion.header
          className="yt-topbar"
          initial={reducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.topbar }}
        >
          <Link href="/" className="yt-wordmark" aria-label="YucaTanaTrades overview">
            YUCATANATRADES
          </Link>
          <nav className="yt-topnav" aria-label="Workspace navigation">
            {topRoutes.map((route) => {
              const active = isRouteActive(location, route.href);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {route.label}
                  {active && (
                    <motion.span
                      layoutId="yt-topnav-active"
                      transition={motionTokens.spring.snappy}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            className="yt-search-trigger"
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Open global search"
          >
            <Search aria-hidden="true" />
            <span>Search markets, tickers, strategies, or ask AI...</span>
            <kbd><Command aria-hidden="true" />K</kbd>
          </button>
          <div className="yt-top-utilities">
            <button
              className="yt-utility-button"
              type="button"
              disabled
              aria-label="Notifications unavailable"
            >
              <Bell aria-hidden="true" />
            </button>
            <button
              className="yt-account-control"
              type="button"
              disabled
              aria-label="Guest workspace, account unavailable"
            >
              <CircleUserRound aria-hidden="true" />
              <span><strong>Guest Workspace</strong><small>Account unavailable</small></span>
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
        </motion.header>

        <main className="yt-route-frame">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location}
              className="yt-route-content"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -7 }}
              transition={reducedMotion
                ? { duration: 0.06 }
                : { duration: motionTokens.duration.route, ease: motionTokens.ease.out }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={goTo}
      />
    </div>
  );
}
