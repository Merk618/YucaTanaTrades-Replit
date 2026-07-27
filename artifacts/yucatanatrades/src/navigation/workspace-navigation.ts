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
    aliases: ["/ai-hub"],
    icon: "ai",
    desktopPlacement: "more",
    description: "Meridian synthesis in a provider-neutral workspace",
    commandLabel: "Open Meridian AI",
    commandDetail: "AI-generated Demo · provider unavailable",
  },
] as const satisfies readonly WorkspaceRouteDefinition[];

export type WorkspaceRouteId = (typeof workspaceRoutes)[number]["id"];

export function routeLocationMatches(location: string, href: string) {
  const path = location.split(/[?#]/, 1)[0] || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function workspaceRouteForLocation(location: string) {
  return workspaceRoutes.find((route) =>
    [route.href, ...route.aliases].some((path) =>
      routeLocationMatches(location, path),
    ),
  );
}

export interface UtilityRouteDefinition {
  id: string;
  label: string;
  href: string;
  icon: NavigationIconKey;
  placement: "rail" | "footer" | "hidden";
  presentation:
    | "route"
    | "scan_drawer"
    | "watchlist_drawer"
    | "alerts_center"
    | "help_panel";
  access:
    | "deferred"
    | "provider_unavailable"
    | "persistent_user"
    | "session";
  classification:
    | "Implemented"
    | "Review Access restricted"
    | "Provider unavailable"
    | "Deferred";
  status:
    | "Implemented"
    | "Review Access restricted"
    | "Provider unavailable"
    | "Deferred";
  title: string;
  description: string;
  commandLabel: string;
  commandDetail: string;
  recoveryHref: "/overview";
  availableNow: string;
  futureCapability: string;
  alternativeHref: string;
  alternativeLabel: string;
  providerClass?: string;
  providerState?: string;
  configurationLocation?: string;
}

export const utilityRoutes = [
  {
    id: "ask-meridian",
    label: "Ask Meridian",
    href: "/ask-meridian",
    icon: "ask",
    placement: "hidden",
    presentation: "route",
    access: "provider_unavailable",
    classification: "Provider unavailable",
    status: "Provider unavailable",
    title: "Ask Meridian is not connected",
    description:
      "The conversational utility is reserved for a future approved model provider. No prompt is sent and no answer is fabricated.",
    commandLabel: "Open Ask Meridian",
    commandDetail: "Deferred · no model request",
    recoveryHref: "/overview",
    availableNow:
      "Research, News, and AI Hub continue to expose deterministic context and explicit provider boundaries without making a model request.",
    futureCapability:
      "Source-aware questions and cited synthesis after an approved model provider is connected.",
    alternativeHref: "/research",
    alternativeLabel: "Open Research",
    providerClass: "Approved AI model and citation provider",
    providerState: "Not configured",
    configurationLocation: "Settings · Application & integrations",
  },
  {
    id: "scan",
    label: "Scan",
    href: "/scanners",
    icon: "scan",
    placement: "rail",
    presentation: "scan_drawer",
    access: "persistent_user",
    classification: "Review Access restricted",
    status: "Review Access restricted",
    title: "Scanner data is unavailable in Local review",
    description:
      "Scanning requires a persistent user session and approved market-data access. This development-review session has neither.",
    commandLabel: "Open scanner",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
    availableNow:
      "The provider-neutral Markets workspace and its fixed historical structures remain available for visual review.",
    futureCapability:
      "Owned scan definitions, provider-backed results, freshness, and review history for persistent users.",
    alternativeHref: "/markets",
    alternativeLabel: "Review Markets",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    href: "/watchlist",
    icon: "watchlist",
    placement: "rail",
    presentation: "watchlist_drawer",
    access: "persistent_user",
    classification: "Review Access restricted",
    status: "Review Access restricted",
    title: "Watchlist persistence is unavailable in Local review",
    description:
      "The development-review principal has no stored user record or owned watchlist. No symbols or results are invented.",
    commandLabel: "Open watchlist",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
    availableNow:
      "Fixed watchlist context remains visible in Charts and News without creating or storing an owned list.",
    futureCapability:
      "Owned symbol lists, saved context, and provider-backed observations tied to a persistent user.",
    alternativeHref: "/markets",
    alternativeLabel: "Review Markets",
  },
  {
    id: "alerts",
    label: "Alerts",
    href: "/alerts",
    icon: "alerts",
    placement: "rail",
    presentation: "alerts_center",
    access: "provider_unavailable",
    classification: "Provider unavailable",
    status: "Provider unavailable",
    title: "Alert monitoring is not connected",
    description:
      "Monitoring, delivery, and provider-backed alert evaluation are not configured. No alert events are fabricated.",
    commandLabel: "Open alerts",
    commandDetail: "Deferred · no monitoring provider",
    recoveryHref: "/overview",
    availableNow:
      "Risk, portfolio, and market Demo context remains readable, but no background monitor evaluates or delivers an alert.",
    futureCapability:
      "Owned alert rules, provider-backed evaluation, delivery status, and revocation controls.",
    alternativeHref: "/markets",
    alternativeLabel: "Review Markets",
    providerClass: "Market monitoring and notification delivery",
    providerState: "Not configured",
    configurationLocation: "Settings · Notifications & alerts",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/journal",
    icon: "journal",
    placement: "hidden",
    presentation: "route",
    access: "persistent_user",
    classification: "Review Access restricted",
    status: "Review Access restricted",
    title: "Journal persistence is unavailable in Local review",
    description:
      "Private notes require a persistent, server-derived user identity. The development-review principal stores no journal records.",
    commandLabel: "Open journal",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
    availableNow:
      "The Research workspace remains available for reviewing deterministic dossiers without saving private notes.",
    futureCapability:
      "Private research notes, decision records, and owned review history for a persistent user.",
    alternativeHref: "/research",
    alternativeLabel: "Open Research",
  },
  {
    id: "calendar",
    label: "Calendar",
    href: "/calendar",
    icon: "calendar",
    placement: "hidden",
    presentation: "route",
    access: "provider_unavailable",
    classification: "Provider unavailable",
    status: "Provider unavailable",
    title: "Calendar intelligence is not connected",
    description:
      "No approved calendar provider is connected. No events, dates, or market catalysts are fabricated.",
    commandLabel: "Open calendar",
    commandDetail: "Deferred · provider unavailable",
    recoveryHref: "/overview",
    availableNow:
      "Overview keeps the catalyst area visibly unavailable, with no invented events, dates, or freshness claims.",
    futureCapability:
      "Sourced economic and company events with freshness, provenance, and workspace relevance.",
    alternativeHref: "/news",
    alternativeLabel: "Review News",
    providerClass: "Economic and company-event calendar",
    providerState: "Not configured",
    configurationLocation: "Settings · Data providers & health",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: "settings",
    placement: "footer",
    presentation: "route",
    access: "session",
    classification: "Implemented",
    status: "Implemented",
    title: "Settings",
    description:
      "Session, provider-health, application, privacy, and display controls are available within their truthful local-development boundaries.",
    commandLabel: "Open settings",
    commandDetail: "Session, truth, and display controls",
    recoveryHref: "/overview",
    availableNow:
      "Current-session context, provider status, preferences, motion, privacy, and application-state surfaces are available.",
    futureCapability:
      "Session, display, provider-boundary, and user-owned preference controls.",
    alternativeHref: "/overview",
    alternativeLabel: "Return to Overview",
  },
  {
    id: "help",
    label: "Help",
    href: "/help",
    icon: "help",
    placement: "footer",
    presentation: "help_panel",
    access: "deferred",
    classification: "Deferred",
    status: "Deferred",
    title: "Help center is deferred",
    description:
      "A support and documentation provider has not been connected. The application does not invent support availability.",
    commandLabel: "Open help",
    commandDetail: "Deferred · documentation foundation",
    recoveryHref: "/overview",
    availableNow:
      "Route-level provenance, security boundaries, and capability-state explanations remain available throughout Meridian OS.",
    futureCapability:
      "Product guidance, security documentation, support boundaries, and versioned release notes.",
    alternativeHref: "/overview",
    alternativeLabel: "Return to Overview",
  },
  {
    id: "bots",
    label: "Automation",
    href: "/bots",
    icon: "bots",
    placement: "hidden",
    presentation: "route",
    access: "persistent_user",
    classification: "Review Access restricted",
    status: "Review Access restricted",
    title: "Automation is unavailable in Local review",
    description:
      "Automation requires a persistent user identity and provider configuration. Review Access grants neither.",
    commandLabel: "Open automation",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
    availableNow:
      "No automation runs in Local review; the Overview and Markets surfaces remain available as read-only context.",
    futureCapability:
      "Owned automation definitions, provider state, audit history, and explicit execution boundaries.",
    alternativeHref: "/overview",
    alternativeLabel: "Return to Overview",
  },
  {
    id: "risk",
    label: "Risk",
    href: "/risk",
    icon: "risk",
    placement: "hidden",
    presentation: "route",
    access: "persistent_user",
    classification: "Review Access restricted",
    status: "Review Access restricted",
    title: "Account risk is unavailable in Local review",
    description:
      "User-owned positions and risk thresholds require a persistent user identity. No account state is fabricated.",
    commandLabel: "Open risk",
    commandDetail: "Persistent user data required",
    recoveryHref: "/overview",
    availableNow:
      "The Portfolio Demo and its clearly labeled concentration context remain available without loading owned positions.",
    futureCapability:
      "Owned exposure, thresholds, scenario context, and provider-backed portfolio risk.",
    alternativeHref: "/portfolio",
    alternativeLabel: "Review Portfolio",
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
  | "provider_unavailable"
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
export const dockUtilityRoutes = [
  ...railUtilityRoutes,
  ...footerUtilityRoutes,
] as const;

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
  if (route.access === "provider_unavailable") return "provider_unavailable";
  if (
    route.access === "persistent_user" &&
    sessionType === "development_review"
  ) {
    return "persistent_user_required";
  }
  return "available";
}
