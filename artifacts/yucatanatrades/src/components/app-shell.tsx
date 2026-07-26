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
import { MeridianAtmosphere } from "@/components/meridian-atmosphere";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import {
  footerUtilityRoutes,
  moreWorkspaceRoutes,
  navigableUtilityRoutes,
  primaryWorkspaceRoutes,
  railUtilityRoutes,
  routeLocationMatches,
  workspaceRouteForLocation,
  workspaceRoutes,
  type NavigationIconKey,
} from "@/navigation/workspace-navigation";
import "../meridian-eclipse-shell.css";

const navigationIcons = {
  home: Home,
  markets: LineChart,
  charts: ChartCandlestick,
  portfolio: BriefcaseBusiness,
  research: BookOpen,
  news: Newspaper,
  ai: Bot,
  ask: Sparkles,
  scan: Radar,
  watchlist: Eye,
  alerts: Bell,
  journal: NotebookPen,
  calendar: CalendarDays,
  settings: Settings,
  help: CircleHelp,
  bots: Bot,
  risk: ShieldOff,
} satisfies Record<NavigationIconKey, React.ElementType>;

const topRoutes = workspaceRoutes.map((route) => ({
  ...route,
  icon: navigationIcons[route.icon],
}));
const primaryTopRoutes = primaryWorkspaceRoutes.map((route) => ({
  ...route,
  icon: navigationIcons[route.icon],
}));
const moreTopRoutes = moreWorkspaceRoutes.map((route) => ({
  ...route,
  icon: navigationIcons[route.icon],
}));
const railRoutes = railUtilityRoutes.map((route) => ({
  ...route,
  icon: navigationIcons[route.icon],
}));
const footerRoutes = footerUtilityRoutes.map((route) => ({
  ...route,
  icon: navigationIcons[route.icon],
}));
const mobileUtilityRoutes = navigableUtilityRoutes.map((route) => ({
  ...route,
  icon: navigationIcons[route.icon],
}));
const commandItems = [
  ...workspaceRoutes.map((route) => ({
    label: route.commandLabel,
    detail: route.commandDetail,
    href: route.href,
    icon: navigationIcons[route.icon],
  })),
  ...navigableUtilityRoutes.map((route) => ({
    label: route.commandLabel,
    detail: route.commandDetail,
    href: route.href,
    icon: navigationIcons[route.icon],
  })),
];

function isRouteActive(location: string, href: string) {
  const workspaceRoute = workspaceRoutes.find((route) => route.href === href);
  if (workspaceRoute) {
    return workspaceRouteForLocation(location)?.id === workspaceRoute.id;
  }
  return routeLocationMatches(location, href);
}

function activateRouteLink(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (href: string) => void,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  onNavigate(href);
}

function WorkspaceLink({
  label,
  href,
  location,
  indicator,
  onNavigate,
}: {
  label: string;
  href: string;
  location: string;
  indicator: string;
  onNavigate: (href: string) => void;
}) {
  const active = isRouteActive(location, href);
  return (
    <Link
      href={href}
      className={active ? "is-active" : undefined}
      aria-current={active ? "page" : undefined}
      onClick={(event) => activateRouteLink(event, href, onNavigate)}
    >
      <span className="yt-workspace-link-label">{label}</span>
      {active ? (
        <motion.span
          className="yt-workspace-active-capsule"
          layoutId={indicator}
          transition={motionTokens.spring.snappy}
        />
      ) : null}
    </Link>
  );
}

function WorkspaceMoreMenu({
  location,
  onNavigate,
  indicator,
}: {
  location: string;
  onNavigate: (href: string) => void;
  indicator: string;
}) {
  const active = moreTopRoutes.some((route) =>
    isRouteActive(location, route.href),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`yt-topnav-more${active ? " is-active" : ""}`}
          type="button"
          aria-label="Open News and AI Hub workspaces"
        >
          <span className="yt-topnav-more-label">More</span>
          <ChevronDown aria-hidden="true" />
          {active ? (
            <motion.span
              className="yt-workspace-active-capsule"
              layoutId={indicator}
              transition={motionTokens.spring.snappy}
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={9}
        className="yt-workspace-dropdown yt-eclipse-more-menu"
      >
        <DropdownMenuLabel className="yt-eclipse-more-heading">
          <span>Meridian OS</span>
          <strong>Intelligence workspaces</strong>
          <small>Continue from market structure into sourced context or synthesis.</small>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {moreTopRoutes.map((route) => (
          <DropdownMenuItem
            key={route.href}
            onSelect={() => onNavigate(route.href)}
            className={`yt-eclipse-more-item${isRouteActive(location, route.href) ? " is-active" : ""}`}
          >
            <span className="yt-eclipse-more-icon"><route.icon aria-hidden="true" /></span>
            <span className="yt-eclipse-more-copy">
              <strong>{route.label}</strong>
              <small>{route.description}</small>
            </span>
          </DropdownMenuItem>
        ))}
        <div className="yt-eclipse-more-footnote" aria-hidden="true">
          <span />
          <small>Provider boundaries remain visible in each workspace</small>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
  onNavigate,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  onNavigate: (href: string) => void;
}) {
  const tooltipId = React.useId();

  return (
    <Link
      href={href}
      className="yt-rail-link"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      aria-describedby={tooltipId}
      onClick={(event) => activateRouteLink(event, href, onNavigate)}
    >
      {active && (
        <motion.span
          layoutId="yt-active-route"
          className="yt-rail-active"
          transition={motionTokens.spring.snappy}
        />
      )}
      <Icon aria-hidden="true" />
      <span id={tooltipId} className="yt-rail-tooltip" role="tooltip">{label}</span>
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
          <button
            className="yt-rail-link"
            type="button"
            aria-label={`Open account session menu for ${primaryLabel}, ${secondaryLabel}`}
          >
            <CircleUserRound aria-hidden="true" />
            <span className="yt-rail-tooltip" role="tooltip">
              {primaryLabel} · {secondaryLabel}
            </span>
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

function MobileSessionItems() {
  const { state, signOut, signOutAllDevices } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pending, setPending] = React.useState<"current" | "all" | null>(null);

  if (state.kind !== "authenticated") return null;

  const reviewSession = state.session.sessionType === "development_review";
  const primaryLabel = reviewSession
    ? "Visual Review"
    : state.user.displayName?.trim() || state.user.email;
  const secondaryLabel = reviewSession
    ? "Local development session"
    : state.user.email;

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
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="yt-account-menu-label">
        <strong>{primaryLabel}</strong>
        <span>{secondaryLabel}</span>
      </DropdownMenuLabel>
      <DropdownMenuItem
        disabled={pending !== null}
        onSelect={() => void runSignOut(false)}
      >
        <LogOut aria-hidden="true" />
        {pending === "current" ? "Signing out…" : "Sign out"}
      </DropdownMenuItem>
      {!reviewSession ? (
        <DropdownMenuItem
          disabled={pending !== null}
          onSelect={() => void runSignOut(true)}
        >
          <ShieldOff aria-hidden="true" />
          {pending === "all" ? "Revoking sessions…" : "Sign out all devices"}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const searchTriggerRef = React.useRef<HTMLButtonElement>(null);
  const routeScrollRef = React.useRef<HTMLElement>(null);
  const pendingRouteFocusRef = React.useRef<string | null>(null);
  const previousLocationRef = React.useRef(location);
  const initialRouteRef = React.useRef(true);
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

  React.useLayoutEffect(() => {
    routeScrollRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
    const initialRoute = initialRouteRef.current;
    const locationChanged = previousLocationRef.current !== location;
    initialRouteRef.current = false;
    previousLocationRef.current = location;
    pendingRouteFocusRef.current = location;

    const focusFrame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      const documentOwnsFocus =
        activeElement === document.body ||
        activeElement === document.documentElement ||
        activeElement === null;
      if (
        pendingRouteFocusRef.current === location &&
        (locationChanged || !initialRoute || documentOwnsFocus)
      ) {
        pendingRouteFocusRef.current = null;
        routeScrollRef.current?.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [location]);

  const goTo = (href: string) => {
    setCommandOpen(false);
    pendingRouteFocusRef.current = href;
    if (href === location) {
      window.requestAnimationFrame(() => {
        pendingRouteFocusRef.current = null;
        routeScrollRef.current?.focus({ preventScroll: true });
      });
      return;
    }
    navigate(href);
  };

  const closeCommand = React.useCallback(() => {
    setCommandOpen(false);
    window.requestAnimationFrame(() => searchTriggerRef.current?.focus());
  }, []);

  const handleRouteScrollKey = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return;
    }

    const scrollOwner = event.currentTarget;
    const pageStep = Math.max(1, Math.round(scrollOwner.clientHeight * 0.82));
    const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
    let delta = 0;

    if (event.key === "PageDown" || event.key === " ") delta = pageStep;
    if (event.key === "PageUp") delta = -pageStep;
    if (event.key === "ArrowDown") delta = 56;
    if (event.key === "ArrowUp") delta = -56;

    if (delta !== 0) {
      event.preventDefault();
      scrollOwner.scrollBy({ top: delta, behavior });
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      scrollOwner.scrollTo({
        top: event.key === "Home" ? 0 : scrollOwner.scrollHeight,
        behavior,
      });
    }
  };

  return (
    <div className="yt-app">
      <MeridianAtmosphere location={location} reducedMotion={Boolean(reducedMotion)} />
      <motion.aside
        className="yt-icon-rail"
        aria-label="Global utilities"
        initial={reducedMotion ? false : { opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reducedMotion ? { duration: 0 } : motionTokens.spring.panel}
      >
        <Link
          href="/overview"
          className="yt-rail-brand"
          aria-label="YucaTanaTrades overview"
          onClick={(event) => activateRouteLink(event, "/overview", goTo)}
        >
          <BrandMark />
        </Link>
        <nav className="yt-rail-routes">
          {railRoutes.map((item) => (
            <RailLink
              key={item.href}
              {...item}
              active={isRouteActive(location, item.href)}
              onNavigate={goTo}
            />
          ))}
        </nav>
        <div className="yt-rail-utilities">
          {footerRoutes.map((item) => (
            <RailLink
              key={item.href}
              {...item}
              active={isRouteActive(location, item.href)}
              onNavigate={goTo}
            />
          ))}
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
          <Link
            href="/overview"
            className="yt-wordmark"
            aria-label="YucaTanaTrades overview"
            onClick={(event) => activateRouteLink(event, "/overview", goTo)}
          >
            YUCATANATRADES
          </Link>
          <nav className="yt-topnav yt-topnav-wide" aria-label="Workspace navigation">
            {primaryTopRoutes.map((route) => <WorkspaceLink key={route.href} {...route} location={location} indicator="yt-topnav-active-wide" onNavigate={goTo} />)}
            <WorkspaceMoreMenu location={location} onNavigate={goTo} indicator="yt-topnav-active-wide" />
          </nav>
          <nav className="yt-topnav yt-topnav-compact" aria-label="Workspace navigation">
            {primaryTopRoutes.map((route) => <WorkspaceLink key={route.href} {...route} location={location} indicator="yt-topnav-active-compact" onNavigate={goTo} />)}
            <WorkspaceMoreMenu location={location} onNavigate={goTo} indicator="yt-topnav-active-compact" />
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
        </motion.header>

        <main
          ref={routeScrollRef}
          className="yt-route-frame"
          tabIndex={-1}
          data-scroll-owner="authenticated-route"
          aria-label="Meridian OS workspace content"
          onKeyDown={handleRouteScrollKey}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location}
              className="yt-route-content"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0, pointerEvents: "none" }
                  : { opacity: 0, y: -7, pointerEvents: "none" }
              }
              transition={reducedMotion
                ? { duration: 0.06 }
                : { duration: motionTokens.duration.route, ease: motionTokens.ease.out }}
            >
              <RouteErrorBoundary route={location}>
                {children}
              </RouteErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="yt-mobile-bottom-nav" aria-label="Mobile workspace navigation">
        {topRoutes.slice(0, 4).map((route) => {
          const active = isRouteActive(location, route.href);
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={(event) => activateRouteLink(event, route.href, goTo)}
            >
              <Icon aria-hidden="true" /><span>{route.label}</span>
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={topRoutes.slice(4).some((route) => isRouteActive(location, route.href)) || mobileUtilityRoutes.some((route) => isRouteActive(location, route.href)) ? "is-active" : undefined} type="button">
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
            {mobileUtilityRoutes.map((route) => (
              <DropdownMenuItem key={route.href} onSelect={() => goTo(route.href)} className={isRouteActive(location, route.href) ? "is-active" : undefined}>
                <route.icon aria-hidden="true" /> {route.label}
              </DropdownMenuItem>
            ))}
            <MobileSessionItems />
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
