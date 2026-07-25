export type NavigationIconKey =
  | "home"
  | "markets"
  | "charts"
  | "portfolio"
  | "research"
  | "news"
  | "ai"
  | "ask"
  | "scan"
  | "watchlist"
  | "alerts"
  | "journal"
  | "calendar"
  | "settings"
  | "help"
  | "bots"
  | "risk";

export interface WorkspaceRouteDefinition {
  id: string;
  label: string;
  href: string;
  aliases: readonly string[];
  icon: NavigationIconKey;
  desktopPlacement: "primary" | "more";
  description: string;
  commandLabel: string;
  commandDetail: string;
}

export const workspaceRoutes = [
  {
    id: "overview",
    label: "Overview",
    href: "/overview",
    aliases: [],
    icon: "home",
    desktopPlacement: "primary",
    description: "Meridian OS decision workspace",
    commandLabel: "Open overview",
    commandDetail: "Demo decision workspace",
  },
  {
    id: "markets",
    label: "Markets",
    href: "/markets",
    aliases: ["/markets/stocks", "/markets/crypto"],
    icon: "markets",
    desktopPlacement: "primary",
    description: "Historical market structure and context",
    commandLabel: "Open market overview",
    commandDetail: "Historical structure · Demo",
  },
  {
    id: "charts",
    label: "Charts",
    href: "/charts",
    aliases: [],
    icon: "charts",
    desktopPlacement: "primary",
    description: "Deterministic analytical chart workspace",
    commandLabel: "Open chart workspace",
    commandDetail: "Historical · Demo",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    href: "/portfolio",
    aliases: [],
    icon: "portfolio",
    desktopPlacement: "primary",
    description: "Provider-neutral portfolio intelligence",
    commandLabel: "Review portfolio",
    commandDetail: "Demo snapshot · provider-neutral",
  },
  {
    id: "research",
    label: "Research",
    href: "/research",
    aliases: [],
    icon: "research",
    desktopPlacement: "primary",
    description: "Demo organization · providers unavailable",
    commandLabel: "Open research",
    commandDetail: "Demo organization · providers unavailable",
  },
  {
    id: "news",
    label: "News",
    href: "/news",
    aliases: [],
    icon: "news",
    desktopPlacement: "more",
    description: "Source-first intelligence and market context",
    commandLabel: "Open news intelligence",
    commandDetail: "News provider unavailable",
  },
  {
    id: "ai-hub",
    label: "AI Hub",
    href: "/ai-lab",
    aliases: [],
    icon: "ai",
    desktopPlacement: "more",
    description: "Meridian synthesis in a provider-neutral workspace",
    commandLabel: "Open Meridian AI",
    commandDetail: "AI-generated Demo · provider unavailable",
  },
] as const satisfies readonly WorkspaceRouteDefinition[];

export type WorkspaceRouteId = (typeof workspaceRoutes)[number]["id"];

export interface UtilityRouteDefinition {
  id: string;
  label: string;
  href: string;
  icon: NavigationIconKey;
  placement: "rail" | "footer" | "hidden";
  access: "deferred" | "persistent_user" | "session";
  status: "Deferred" | "Unavailable";
  title: string;
  description: string;
  commandLabel: string;
  commandDetail: string;
  recoveryHref: "/overview";
}

export const utilityRoutes = [
  {
    id: "ask-meridian",
    label: "Ask Meridian",
    href: "/ask-meridian",
    icon: "ask",
    placement: "rail",
    access: "deferred",
    status: "Deferred",
    title: "Ask Meridian is not connected",
    description:
      "The conversational utility is reserved for a future approved model provider. No prompt is sent and no answer is fabricated.",
    commandLabel: "Open Ask Meridian",
    commandDetail: "Deferred · no model request",
    recoveryHref: "/overview",
  },
  {
    id: "scan",
    label: "Scan",
    href: "/scanners",
    icon: "scan",
    placement: "rail",
    access: "persistent_user",
    status: "Unavailable",
    title: "Scanner data is unavailable in Local review",
    description:
      "Scanning requires a persistent user session and approved market-data access. This development-review session has neither.",
    commandLabel: "Open scanner",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    href: "/watchlist",
    icon: "watchlist",
    placement: "rail",
    access: "persistent_user",
    status: "Unavailable",
    title: "Watchlist persistence is unavailable in Local review",
    description:
      "The development-review principal has no stored user record or owned watchlist. No symbols or results are invented.",
    commandLabel: "Open watchlist",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
  },
  {
    id: "alerts",
    label: "Alerts",
    href: "/alerts",
    icon: "alerts",
    placement: "rail",
    access: "deferred",
    status: "Deferred",
    title: "Alerts are deferred",
    description:
      "Monitoring, delivery, and provider-backed alert evaluation are not configured. No alert events are fabricated.",
    commandLabel: "Open alerts",
    commandDetail: "Deferred · no monitoring provider",
    recoveryHref: "/overview",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/journal",
    icon: "journal",
    placement: "rail",
    access: "persistent_user",
    status: "Unavailable",
    title: "Journal persistence is unavailable in Local review",
    description:
      "Private notes require a persistent, server-derived user identity. The development-review principal stores no journal records.",
    commandLabel: "Open journal",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
  },
  {
    id: "calendar",
    label: "Calendar",
    href: "/calendar",
    icon: "calendar",
    placement: "rail",
    access: "deferred",
    status: "Deferred",
    title: "Calendar intelligence is deferred",
    description:
      "No approved calendar provider is connected. No events, dates, or market catalysts are fabricated.",
    commandLabel: "Open calendar",
    commandDetail: "Deferred · provider unavailable",
    recoveryHref: "/overview",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: "settings",
    placement: "footer",
    access: "session",
    status: "Unavailable",
    title: "Settings are unavailable",
    description: "Session settings could not be opened.",
    commandLabel: "Open settings",
    commandDetail: "Session, truth, and display controls",
    recoveryHref: "/overview",
  },
  {
    id: "help",
    label: "Help",
    href: "/help",
    icon: "help",
    placement: "footer",
    access: "deferred",
    status: "Deferred",
    title: "Help center is deferred",
    description:
      "A support and documentation provider has not been connected. The application does not invent support availability.",
    commandLabel: "Open help",
    commandDetail: "Deferred · documentation foundation",
    recoveryHref: "/overview",
  },
  {
    id: "bots",
    label: "Automation",
    href: "/bots",
    icon: "bots",
    placement: "hidden",
    access: "persistent_user",
    status: "Unavailable",
    title: "Automation is unavailable in Local review",
    description:
      "Automation requires a persistent user identity and provider configuration. Review Access grants neither.",
    commandLabel: "Open automation",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
  },
  {
    id: "risk",
    label: "Risk",
    href: "/risk",
    icon: "risk",
    placement: "hidden",
    access: "persistent_user",
    status: "Unavailable",
    title: "Account risk is unavailable in Local review",
    description:
      "User-owned positions and risk thresholds require a persistent user identity. No account state is fabricated.",
    commandLabel: "Open risk",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
  },
] as const satisfies readonly UtilityRouteDefinition[];

export type UtilityRoute = (typeof utilityRoutes)[number];
export type UtilityRouteId = UtilityRoute["id"];
export type ImplementedUtilityRouteId = Extract<
  UtilityRoute,
  { access: "persistent_user" | "session" }
>["id"];
export type ReviewSessionType = "guest" | "user" | "development_review";
export type UtilityAvailability =
  | "available"
  | "deferred"
  | "persistent_user_required";

export const primaryWorkspaceRoutes = workspaceRoutes.filter(
  (route) => route.desktopPlacement === "primary",
);
export const moreWorkspaceRoutes = workspaceRoutes.filter(
  (route) => route.desktopPlacement === "more",
);
export const railUtilityRoutes = utilityRoutes.filter(
  (route) => route.placement === "rail",
);
export const footerUtilityRoutes = utilityRoutes.filter(
  (route) => route.placement === "footer",
);
export const navigableUtilityRoutes = utilityRoutes.filter(
  (route) => route.placement !== "hidden",
);

export const protectedRoutePaths = [
  ...workspaceRoutes.flatMap((route) => [route.href, ...route.aliases]),
  ...utilityRoutes.map((route) => route.href),
] as const;

export const defaultProtectedDestination = "/overview";

export function isProtectedRoutePath(pathname: string): boolean {
  return protectedRoutePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function utilityAvailabilityForSession(
  route: UtilityRoute,
  sessionType: ReviewSessionType,
): UtilityAvailability {
  if (route.access === "deferred") return "deferred";
  if (
    route.access === "persistent_user" &&
    sessionType === "development_review"
  ) {
    return "persistent_user_required";
  }
  return "available";
}
