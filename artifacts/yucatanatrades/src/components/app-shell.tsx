import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChartCandlestick,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  Command,
  Eye,
  Home,
  LineChart,
  LogOut,
  MoreHorizontal,
  Newspaper,
  NotebookPen,
  Radar,
  Search,
  Settings,
  ShieldOff,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/auth/auth-provider";
import { safeAuthErrorMessage } from "@/auth/auth-error-copy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motionTokens } from "@/lib/motion";

const topRoutes = [
  { label: "Overview", href: "/overview", icon: Home },
  { label: "Markets", href: "/markets", icon: LineChart },
  { label: "Charts", href: "/charts", icon: ChartCandlestick },
  { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Research", href: "/research", icon: BookOpen },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "AI Hub", href: "/ai-lab", icon: Bot },
] as const;

const railRoutes = [
  { label: "Ask Meridian / Scan", href: "/scanners", icon: Radar },
  { label: "Watchlist", href: "/watchlist", icon: Eye },
  { label: "Journal", href: "/journal", icon: NotebookPen },
] as const;

const commandItems = [
  { label: "Open overview", detail: "Demo decision workspace", href: "/overview", icon: Home },
  { label: "Open market overview", detail: "Historical structure · Demo", href: "/markets", icon: LineChart },
  { label: "Open chart workspace", detail: "Historical · Demo", href: "/charts", icon: ChartCandlestick },
  { label: "Review portfolio", detail: "Demo snapshot · provider-neutral", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Open research", detail: "Demo organization · providers unavailable", href: "/research", icon: BookOpen },
  { label: "Open news intelligence", detail: "News provider unavailable", href: "/news", icon: Newspaper },
  { label: "Open Meridian AI", detail: "AI-generated Demo · provider unavailable", href: "/ai-lab", icon: Sparkles },
  { label: "Open scanner", detail: "Deterministic utility workspace", href: "/scanners", icon: Radar },
  { label: "Open watchlist", detail: "Local utility workspace", href: "/watchlist", icon: Eye },
  { label: "Open journal", detail: "Private notes workspace", href: "/journal", icon: NotebookPen },
  { label: "Open settings", detail: "Session, truth, and display controls", href: "/settings", icon: Settings },
] as const;

function isRouteActive(location: string, href: string) {
  if (href === "/overview") return location === "/overview";
  return location === href || location.startsWith(`${href}/`);
}

function WorkspaceLink({
  label,
  href,
  location,
  indicator,
}: {
  label: string;
  href: string;
  location: string;
  indicator: string;
}) {
  const active = isRouteActive(location, href);
  return (
    <Link
      href={href}
      className={active ? "is-active" : undefined}
      aria-current={active ? "page" : undefined}
    >
      {label}
      {active ? <motion.span layoutId={indicator} transition={motionTokens.spring.snappy} /> : null}
    </Link>
  );
}

export function BrandMark() {
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

function RailAction({
  label,
  icon: Icon,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className="yt-rail-link" type="button" disabled={disabled} aria-label={label} onClick={onClick}>
      <Icon aria-hidden="true" />
      <span className="yt-rail-tooltip" role="tooltip">{label}</span>
    </button>
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
  const dialogRef = React.useRef<HTMLElement>(null);
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
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
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
            ref={dialogRef}
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
              <label className="sr-only" htmlFor="yt-command-input" id="yt-command-title">Workspace route navigator</label>
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
                placeholder="Find a workspace route…"
                autoComplete="off"
              />
              <button type="button" className="yt-icon-button" onClick={onClose} aria-label="Close route navigator">
                <X aria-hidden="true" />
              </button>
            </form>
            <div className="yt-command-meta">
              <span>Static route commands</span>
              <span>Provider-neutral review</span>
            </div>
            <div id="yt-command-results" className="yt-command-results" role="listbox" aria-label="Workspace routes">
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
                  No matching workspace route.
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { state, signOut, signOutAllDevices } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pending, setPending] = React.useState<"current" | "all" | null>(null);

  if (state.kind !== "authenticated") return null;

  const reviewSession = state.session.sessionType === "development_review";
  const primaryLabel = reviewSession
    ? "Visual Review"
    : state.user.displayName?.trim() || state.user.email;
  const secondaryLabel = reviewSession ? "Local development session" : "Meridian OS";

  const runSignOut = async (allDevices: boolean) => {
    setPending(allDevices ? "all" : "current");
    try {
      if (allDevices) await signOutAllDevices();
      else await signOut();
      navigate("/");
    } catch (error) {
      toast({
        title: "Secure sign-out unavailable",
        description: safeAuthErrorMessage(error, "sign-out"),
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button className="yt-rail-link" type="button" aria-label="Open account session menu">
            <CircleUserRound aria-hidden="true" />
            <span className="yt-rail-tooltip" role="tooltip">Account session</span>
          </button>
        ) : (
          <button className="yt-account-control" type="button" aria-label={`Account session for ${primaryLabel}`}>
            <CircleUserRound aria-hidden="true" />
            <span><strong title={primaryLabel}>{primaryLabel}</strong><small>{secondaryLabel}</small></span>
            <ChevronDown aria-hidden="true" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "start" : "end"} side={compact ? "right" : "bottom"} className="yt-account-menu">
        <DropdownMenuLabel className="yt-account-menu-label">
          <strong>{primaryLabel}</strong>
          <span>{reviewSession ? secondaryLabel : state.user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending !== null} onSelect={() => void runSignOut(false)}>
          <LogOut aria-hidden="true" /> {pending === "current" ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
        {!reviewSession ? (
          <DropdownMenuItem disabled={pending !== null} onSelect={() => void runSignOut(true)}>
            <ShieldOff aria-hidden="true" /> {pending === "all" ? "Revoking sessions…" : "Sign out all devices"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const searchTriggerRef = React.useRef<HTMLButtonElement>(null);
  const routeContentRef = React.useRef<HTMLDivElement>(null);
  const pendingRouteFocusRef = React.useRef<string | null>(null);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => {
          if (current) {
            window.requestAnimationFrame(() => searchTriggerRef.current?.focus());
          }
          return !current;
        });
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
    pendingRouteFocusRef.current = href;
    if (href === location) {
      window.requestAnimationFrame(() => {
        pendingRouteFocusRef.current = null;
        routeContentRef.current?.focus({ preventScroll: true });
      });
      return;
    }
    navigate(href);
  };

  const closeCommand = React.useCallback(() => {
    setCommandOpen(false);
    window.requestAnimationFrame(() => searchTriggerRef.current?.focus());
  }, []);

  return (
    <div className="yt-app">
      <motion.aside
        className="yt-icon-rail"
        aria-label="Global utilities"
        initial={reducedMotion ? false : { opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reducedMotion ? { duration: 0 } : motionTokens.spring.panel}
      >
        <Link href="/overview" className="yt-rail-brand" aria-label="YucaTanaTrades overview">
          <BrandMark />
        </Link>
        <nav className="yt-rail-routes">
          {railRoutes.map((item) => (
            <RailLink key={item.href} {...item} active={isRouteActive(location, item.href)} />
          ))}
          <RailAction label="Alerts · Deferred" icon={Bell} disabled />
          <RailAction label="Calendar · Deferred" icon={CalendarDays} disabled />
        </nav>
        <div className="yt-rail-utilities">
          <RailLink
            label="Settings"
            href="/settings"
            icon={Settings}
            active={isRouteActive(location, "/settings")}
          />
          <RailAction label="Help · Deferred" icon={CircleHelp} disabled />
          <AccountMenu compact />
        </div>
      </motion.aside>

      <div className="yt-shell-column">
        <motion.header
          className="yt-topbar"
          initial={reducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.topbar }}
        >
          <Link href="/overview" className="yt-wordmark" aria-label="YucaTanaTrades overview">
            YUCATANATRADES
          </Link>
          <nav className="yt-topnav yt-topnav-wide" aria-label="Workspace navigation">
            {topRoutes.map((route) => <WorkspaceLink key={route.href} {...route} location={location} indicator="yt-topnav-active-wide" />)}
          </nav>
          <nav className="yt-topnav yt-topnav-compact" aria-label="Workspace navigation">
            {topRoutes.slice(0, 5).map((route) => <WorkspaceLink key={route.href} {...route} location={location} indicator="yt-topnav-active-compact" />)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`yt-topnav-more${topRoutes.slice(5).some((route) => isRouteActive(location, route.href)) ? " is-active" : ""}`} type="button">
                  More <ChevronDown aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="yt-workspace-dropdown">
                <DropdownMenuLabel>More workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {topRoutes.slice(5).map((route) => (
                  <DropdownMenuItem key={route.href} onSelect={() => goTo(route.href)} className={isRouteActive(location, route.href) ? "is-active" : undefined}>
                    <route.icon aria-hidden="true" /> {route.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          <div className="yt-tablet-workspaces">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="yt-workspace-trigger" type="button"><span>Workspaces</span><ChevronDown aria-hidden="true" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="yt-workspace-dropdown">
                <DropdownMenuLabel>Meridian OS workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {topRoutes.map((route) => (
                  <DropdownMenuItem key={route.href} onSelect={() => goTo(route.href)} className={isRouteActive(location, route.href) ? "is-active" : undefined}>
                    <route.icon aria-hidden="true" /> {route.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            ref={searchTriggerRef}
            className="yt-search-trigger"
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Open workspace route navigator"
          >
            <Search aria-hidden="true" />
            <span>Jump to a workspace…</span>
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
            <AccountMenu />
          </div>
        </motion.header>

        <main className="yt-route-frame">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              ref={routeContentRef}
              key={location}
              className="yt-route-content"
              tabIndex={-1}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -7 }}
              transition={reducedMotion
                ? { duration: 0.06 }
                : { duration: motionTokens.duration.route, ease: motionTokens.ease.out }}
              onAnimationComplete={() => {
                if (pendingRouteFocusRef.current !== location) return;
                pendingRouteFocusRef.current = null;
                routeContentRef.current?.focus({ preventScroll: true });
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="yt-mobile-bottom-nav" aria-label="Mobile workspace navigation">
        {topRoutes.slice(0, 4).map((route) => {
          const active = isRouteActive(location, route.href);
          const Icon = route.icon;
          return (
            <Link key={route.href} href={route.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
              <Icon aria-hidden="true" /><span>{route.label}</span>
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={topRoutes.slice(4).some((route) => isRouteActive(location, route.href)) || ["/scanners", "/watchlist", "/journal", "/settings"].some((href) => isRouteActive(location, href)) ? "is-active" : undefined} type="button">
              <MoreHorizontal aria-hidden="true" /><span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="yt-workspace-dropdown yt-mobile-more-menu">
            <DropdownMenuLabel>More destinations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {topRoutes.slice(4).map((route) => (
              <DropdownMenuItem key={route.href} onSelect={() => goTo(route.href)} className={isRouteActive(location, route.href) ? "is-active" : undefined}>
                <route.icon aria-hidden="true" /> {route.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {[...railRoutes, { label: "Settings", href: "/settings", icon: Settings }].map((route) => (
              <DropdownMenuItem key={route.href} onSelect={() => goTo(route.href)} className={isRouteActive(location, route.href) ? "is-active" : undefined}>
                <route.icon aria-hidden="true" /> {route.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <CommandPalette
        open={commandOpen}
        onClose={closeCommand}
        onNavigate={goTo}
      />
    </div>
  );
}
