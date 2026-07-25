import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  Bot,
  Check,
  CheckCircle,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Gauge,
  Info,
  KeyRound,
  Layers,
  List,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Move,
  Plug,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  WifiOff,
} from "lucide-react";
import type {
  ProviderStatus,
  SourceHealthSummary,
} from "@workspace/api-client-react";
import { useAuth } from "@/auth/auth-provider";
import { RISK_CONFIG } from "@/data/riskConfig";
import {
  formatPrice,
  isQuoteUsable,
  quoteBadge,
  useForceSourceHealth,
  useSourceHealth,
  useTestQuotes,
} from "@/hooks/use-market";
import {
  useRiskConfig,
  useUpdateRiskConfigMutation,
} from "@/hooks/use-risk-config";
import {
  motionTokens,
  panelReveal,
  staggerContainer,
  useAppReducedMotion,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import "../ui2-settings.css";

type StatusTone = "gold" | "positive" | "negative" | "neutral" | "cyan";

type RiskFieldKey =
  | "singlePositionLimit"
  | "cryptoPositionLimit"
  | "cryptoAllocationLimit"
  | "sectorConcentrationLimit"
  | "maxDrawdownAlert";

const NOTIFICATION_SETTINGS = [
  {
    label: "Signal review alerts",
    description: "Local preference foundation; delivery is not connected.",
    enabled: true,
  },
  {
    label: "Risk threshold alerts",
    description: "Flag a configured risk boundary inside Meridian OS.",
    enabled: true,
  },
  {
    label: "Price-level alerts",
    description: "Alert delivery and provider monitoring remain unavailable.",
    enabled: false,
  },
  {
    label: "Journal reminder",
    description: "Local reminder preference; scheduling is deferred.",
    enabled: false,
  },
  {
    label: "Weekly summary",
    description: "Email delivery is not configured in this phase.",
    enabled: false,
  },
] as const;

const RISK_FIELDS: { key: RiskFieldKey; label: string; description: string }[] =
  [
    {
      key: "singlePositionLimit",
      label: "Max single position",
      description: "Concentration alert boundary",
    },
    {
      key: "cryptoPositionLimit",
      label: "Max crypto position",
      description: "Individual crypto exposure",
    },
    {
      key: "cryptoAllocationLimit",
      label: "Crypto allocation",
      description: "Total portfolio boundary",
    },
    {
      key: "sectorConcentrationLimit",
      label: "Sector concentration",
      description: "Single-sector boundary",
    },
    {
      key: "maxDrawdownAlert",
      label: "Drawdown alert",
      description: "Decline from recent highs",
    },
  ];

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "Never";
  const seconds = Math.max(0, Math.round(diff / 1_000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "Not available";
  const value = new Date(iso);
  if (!Number.isFinite(value.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function providerView(provider: ProviderStatus): {
  label: string;
  tone: StatusTone;
  Icon: typeof CheckCircle;
  description: string;
} {
  switch (provider.status) {
    case "connected":
      return {
        label: "Connected",
        tone: "positive",
        Icon: CheckCircle,
        description: "Health endpoint reports an active source.",
      };
    case "delayed":
      return {
        label: "Delayed",
        tone: "cyan",
        Icon: Clock,
        description: "Reachable source with delayed data.",
      };
    case "read_only":
      return {
        label: "Read-only",
        tone: "positive",
        Icon: CheckCircle,
        description: "Connected for observation; execution is disabled.",
      };
    case "missing_api_key":
      return {
        label: "Configuration required",
        tone: "neutral",
        Icon: KeyRound,
        description: "Server-side provider configuration is not present.",
      };
    case "auth_failed":
      return {
        label: "Authorization failed",
        tone: "negative",
        Icon: Ban,
        description: "Provider authorization was rejected.",
      };
    case "health_check_failed":
      return {
        label: "Health check failed",
        tone: "negative",
        Icon: AlertTriangle,
        description: "The provider did not complete its health probe.",
      };
    case "rate_limited":
      return {
        label: "Rate limited",
        tone: "gold",
        Icon: AlertTriangle,
        description: "The provider is temporarily limiting requests.",
      };
    case "stale":
      return {
        label: "Stale",
        tone: "gold",
        Icon: AlertTriangle,
        description:
          "The most recent response is outside its freshness window.",
      };
    case "future_ready":
      return {
        label: "Foundation",
        tone: "cyan",
        Icon: Sparkles,
        description: "Contract foundation exists; the provider is not active.",
      };
    case "disabled":
      return {
        label: "Disabled",
        tone: "neutral",
        Icon: Ban,
        description: "This integration is disabled.",
      };
    default:
      return {
        label: "Unavailable",
        tone: "neutral",
        Icon: Plug,
        description: "No active provider connection is reported.",
      };
  }
}

function summaryView(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "connected":
      return { label: "Connected", tone: "positive" };
    case "delayed":
      return { label: "Delayed", tone: "cyan" };
    case "read_only":
      return { label: "Read-only", tone: "positive" };
    case "analysis_only":
      return { label: "Analysis only", tone: "neutral" };
    default:
      return { label: "No active source", tone: "neutral" };
  }
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return <span className={`yt-settings-pill is-${tone}`}>{children}</span>;
}

function Panel({
  title,
  eyebrow,
  icon: Icon,
  state,
  className,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: typeof Settings;
  state?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      className={cn("yt-settings-panel", className)}
      variants={panelReveal}
    >
      <header className="yt-settings-panel__header">
        <div className="yt-settings-panel__title">
          <span className="yt-settings-panel__icon" aria-hidden="true">
            <Icon />
          </span>
          <div>
            <span>{eyebrow}</span>
            <h2>{title}</h2>
          </div>
        </div>
        {state ? <div className="yt-settings-panel__state">{state}</div> : null}
      </header>
      <div className="yt-settings-panel__body">{children}</div>
    </motion.section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  reducedMotion,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  reducedMotion: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn("yt-settings-toggle", checked && "is-on")}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
    >
      <motion.span
        animate={{ x: checked ? 18 : 2 }}
        transition={
          reducedMotion ? { duration: 0 } : motionTokens.spring.snappy
        }
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="yt-settings-row">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className="yt-settings-row__action">{action}</div>
    </div>
  );
}

export default function SettingsPage() {
  const reducedMotion = useAppReducedMotion();
  const { state, signOut, signOutAllDevices } = useAuth();
  const session = state.kind === "authenticated" ? state.session : null;
  const user = state.kind === "authenticated" ? state.user : null;
  const reviewSession = session?.sessionType === "development_review";
  const reviewEnabled =
    state.kind === "authenticated" && state.status.features.reviewAccessEnabled;
  const identityName = reviewSession
    ? "Visual Review"
    : user?.displayName || "Meridian user";
  const identityDetail = reviewSession
    ? "Local development session"
    : user?.email || "Server identity unavailable";
  const [notifications, setNotifications] = useState(
    NOTIFICATION_SETTINGS.map((item) => item.enabled),
  );
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [chartPreferences, setChartPreferences] = useState([true, true, false]);
  const [authAction, setAuthAction] = useState<{
    pending: "current" | "all" | null;
    error: string | null;
  }>({
    pending: null,
    error: null,
  });

  const cachedHealth = useSourceHealth(60_000, !reviewSession);
  const forcedHealth = useForceSourceHealth();
  const quoteTest = useTestQuotes();
  const useForcedHealth = Boolean(
    forcedHealth.data &&
    forcedHealth.dataUpdatedAt >= cachedHealth.dataUpdatedAt,
  );
  const health = useForcedHealth ? forcedHealth.data : cachedHealth.data;
  const providers = health?.providers ?? [];
  const summary: SourceHealthSummary[] = health?.summary ?? [];
  const usableQuotes = (quoteTest.data?.quotes ?? []).filter(isQuoteUsable);
  const healthLoading = cachedHealth.isLoading && !forcedHealth.data;
  const healthError = cachedHealth.isError && !forcedHealth.data;
  const healthFetching = cachedHealth.isFetching || forcedHealth.isFetching;

  const { config: riskConfig, isLoading: riskLoading } = useRiskConfig(
    !reviewSession,
  );
  const updateRisk = useUpdateRiskConfigMutation();
  const [riskDraft, setRiskDraft] = useState<Record<RiskFieldKey, string>>({
    singlePositionLimit: "",
    cryptoPositionLimit: "",
    cryptoAllocationLimit: "",
    sectorConcentrationLimit: "",
    maxDrawdownAlert: "",
  });
  const [riskEditing, setRiskEditing] = useState(false);
  const [riskMessage, setRiskMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const providerCounts = useMemo(() => {
    const active = providers.filter((provider) =>
      ["connected", "delayed", "read_only"].includes(provider.status),
    ).length;
    return { active, total: providers.length };
  }, [providers]);

  useEffect(() => {
    setRiskDraft({
      singlePositionLimit: String(riskConfig.singlePositionLimit),
      cryptoPositionLimit: String(riskConfig.cryptoPositionLimit),
      cryptoAllocationLimit: String(riskConfig.cryptoAllocationLimit),
      sectorConcentrationLimit: String(riskConfig.sectorConcentrationLimit),
      maxDrawdownAlert: String(riskConfig.maxDrawdownAlert),
    });
  }, [
    riskConfig.singlePositionLimit,
    riskConfig.cryptoPositionLimit,
    riskConfig.cryptoAllocationLimit,
    riskConfig.sectorConcentrationLimit,
    riskConfig.maxDrawdownAlert,
  ]);

  function riskValue(key: RiskFieldKey): number {
    const parsed = Number.parseInt(riskDraft[key], 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function riskDraftValid(): boolean {
    return RISK_FIELDS.every(
      ({ key }) => riskValue(key) >= 1 && riskValue(key) <= 100,
    );
  }

  function restoreRiskDraft() {
    setRiskDraft({
      singlePositionLimit: String(riskConfig.singlePositionLimit),
      cryptoPositionLimit: String(riskConfig.cryptoPositionLimit),
      cryptoAllocationLimit: String(riskConfig.cryptoAllocationLimit),
      sectorConcentrationLimit: String(riskConfig.sectorConcentrationLimit),
      maxDrawdownAlert: String(riskConfig.maxDrawdownAlert),
    });
  }

  async function saveRiskConfig() {
    if (!riskDraftValid()) {
      setRiskMessage({
        ok: false,
        text: "Use a value from 1 through 100 for every threshold.",
      });
      return;
    }
    setRiskMessage({
      ok: true,
      text: "Saving through the current configuration service…",
    });
    try {
      await updateRisk.mutateAsync({
        data: {
          singlePositionLimit: riskValue("singlePositionLimit"),
          cryptoPositionLimit: riskValue("cryptoPositionLimit"),
          cryptoAllocationLimit: riskValue("cryptoAllocationLimit"),
          sectorConcentrationLimit: riskValue("sectorConcentrationLimit"),
          maxDrawdownAlert: riskValue("maxDrawdownAlert"),
        },
      });
      setRiskMessage({
        ok: true,
        text: "Thresholds accepted by the current configuration service.",
      });
      setRiskEditing(false);
    } catch {
      setRiskMessage({
        ok: false,
        text: "Threshold service unavailable. No change was confirmed.",
      });
    }
  }

  function resetRiskToDefaults() {
    setRiskDraft({
      singlePositionLimit: String(RISK_CONFIG.singlePositionLimit),
      cryptoPositionLimit: String(RISK_CONFIG.cryptoPositionLimit),
      cryptoAllocationLimit: String(RISK_CONFIG.cryptoAllocationLimit),
      sectorConcentrationLimit: String(RISK_CONFIG.sectorConcentrationLimit),
      maxDrawdownAlert: String(RISK_CONFIG.maxDrawdownAlert),
    });
    setRiskMessage(null);
  }

  async function handleAuthAction(scope: "current" | "all") {
    setAuthAction({ pending: scope, error: null });
    try {
      if (scope === "all") await signOutAllDevices();
      else await signOut();
    } catch {
      setAuthAction({
        pending: null,
        error: "Secure session service is unavailable. Please retry.",
      });
    }
  }

  return (
    <motion.main
      className={cn("yt-settings", density === "compact" && "is-compact")}
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
      variants={staggerContainer}
      aria-labelledby="yt-settings-title"
    >
      <motion.header className="yt-settings-hero" variants={panelReveal}>
        <div className="yt-settings-hero__copy">
          <span className="yt-settings-eyebrow">
            Meridian OS · Control center
          </span>
          <h1 id="yt-settings-title">
            <Settings aria-hidden="true" />
            Settings
          </h1>
          <p>
            Session security, provider truth, risk boundaries, and local
            workspace preferences.
          </p>
        </div>
        <div className="yt-settings-hero__states" aria-label="Settings scope">
          <StatusPill tone="gold">UI-2.1</StatusPill>
          <StatusPill>Local preferences</StatusPill>
          <StatusPill tone="cyan">Provider-neutral</StatusPill>
        </div>
      </motion.header>

      <div className="yt-settings-account-grid">
        <Panel
          title="Profile & current session"
          eyebrow="Server-derived identity"
          icon={User}
          className="yt-settings-profile"
          state={<StatusPill tone="positive">Authenticated</StatusPill>}
        >
          <div className="yt-settings-identity">
            <span className="yt-settings-avatar" aria-hidden="true">
              {identityName.slice(0, 1).toUpperCase()}
            </span>
            <div className="yt-settings-identity__copy">
              <strong>{identityName}</strong>
              <span>{identityDetail}</span>
              <div>
                <StatusPill tone={reviewSession ? "gold" : "cyan"}>
                  {reviewSession ? "Development review" : "User session"}
                </StatusPill>
                {!reviewSession && user ? (
                  <StatusPill tone={user.emailVerified ? "positive" : "gold"}>
                    {user.emailVerified
                      ? "Email verified"
                      : "Verification pending"}
                  </StatusPill>
                ) : null}
              </div>
            </div>
          </div>
          <dl className="yt-settings-session-facts">
            <div>
              <dt>Session boundary</dt>
              <dd>Opaque · server-side</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{formatExpiry(session?.expiresAt ?? null)}</dd>
            </div>
            <div>
              <dt>Browser protection</dt>
              <dd>HttpOnly cookie · CSRF</dd>
            </div>
            <div>
              <dt>Persistence</dt>
              <dd>{reviewSession ? "None" : "Session service"}</dd>
            </div>
          </dl>
          <div className="yt-settings-actions">
            <button
              type="button"
              className="yt-settings-button"
              onClick={() => void handleAuthAction("current")}
              disabled={authAction.pending !== null}
            >
              {authAction.pending === "current" ? (
                <RefreshCw className="is-spinning" />
              ) : (
                <LogOut />
              )}
              Sign out this session
            </button>
            <button
              type="button"
              className="yt-settings-button is-danger"
              onClick={() => void handleAuthAction("all")}
              disabled={authAction.pending !== null || reviewSession}
            >
              {authAction.pending === "all" ? (
                <RefreshCw className="is-spinning" />
              ) : (
                <Shield />
              )}
              Sign out all devices
            </button>
          </div>
          {reviewSession ? (
            <p className="yt-settings-note">
              All-device sign-out is not presented as a device-management
              feature for a non-persistent review principal.
            </p>
          ) : null}
          {authAction.error ? (
            <p className="yt-settings-message is-error" role="alert">
              {authAction.error}
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Authentication"
          eyebrow="Protected boundary"
          icon={Lock}
          state={<StatusPill tone="positive">Active</StatusPill>}
        >
          <div className="yt-settings-security-list">
            <SettingRow
              title="Identity"
              description="Resolved by the server for this request."
              action={<Check aria-hidden="true" />}
            />
            <SettingRow
              title="Session rotation"
              description="Rotated after successful authentication."
              action={<Check aria-hidden="true" />}
            />
            <SettingRow
              title="Write protection"
              description="Synchronizer-token CSRF boundary."
              action={<Check aria-hidden="true" />}
            />
            <SettingRow
              title="Password storage"
              description="Argon2id on the authentication service."
              action={<Check aria-hidden="true" />}
            />
          </div>
        </Panel>

        <Panel
          title="Active sessions"
          eyebrow="Revocation controls"
          icon={Monitor}
          state={<StatusPill>Current browser</StatusPill>}
        >
          <div className="yt-settings-device">
            <span>
              <Monitor aria-hidden="true" />
            </span>
            <div>
              <strong>This browser</strong>
              <small>
                {reviewSession
                  ? "Local review · short-lived"
                  : "Current authenticated session"}
              </small>
            </div>
            <StatusPill tone="positive">Current</StatusPill>
          </div>
          <SettingRow
            title="Device inventory"
            description="A cross-device inventory is not exposed in this phase."
            action={<StatusPill>Foundation</StatusPill>}
          />
          <SettingRow
            title="Revocation"
            description="All-device revocation is available to persistent user sessions."
            action={
              <StatusPill tone={reviewSession ? "neutral" : "positive"}>
                {reviewSession ? "Not applicable" : "Available"}
              </StatusPill>
            }
          />
        </Panel>

        <Panel
          title="Owner Review Access"
          eyebrow="Development-only principal"
          icon={KeyRound}
          state={
            <StatusPill
              tone={reviewSession ? "gold" : reviewEnabled ? "cyan" : "neutral"}
            >
              {reviewSession
                ? "In use"
                : reviewEnabled
                  ? "Enabled locally"
                  : "Unavailable"}
            </StatusPill>
          }
        >
          <p className="yt-settings-lead">
            A short-lived, non-persistent visual-review session. It is not a
            production administrator account.
          </p>
          <dl className="yt-settings-compact-facts">
            <div>
              <dt>Environment</dt>
              <dd>
                {reviewEnabled || reviewSession
                  ? "Local development"
                  : "Not available"}
              </dd>
            </div>
            <div>
              <dt>Production permissions</dt>
              <dd>None</dd>
            </div>
            <div>
              <dt>Database user</dt>
              <dd>Never created</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel
        title="Data providers & health"
        eyebrow="Connection truth"
        icon={Plug}
        className="yt-settings-providers"
        state={
          <StatusPill tone={providerCounts.active > 0 ? "positive" : "neutral"}>
            {providerCounts.active} of {providerCounts.total} active
          </StatusPill>
        }
      >
        <div className="yt-settings-provider-toolbar">
          <div>
            <strong>Health diagnostics</strong>
            <span>
              {health
                ? `Last checked ${timeAgo(health.asOf)} · ${useForcedHealth ? "forced probe" : "cached status"}`
                : "Waiting for the health endpoint"}
            </span>
          </div>
          <div>
            <button
              type="button"
              className="yt-settings-button"
              onClick={() => void forcedHealth.refetch()}
              disabled={healthFetching}
            >
              <RefreshCw className={cn(healthFetching && "is-spinning")} />
              Re-check health
            </button>
            <button
              type="button"
              className="yt-settings-button is-primary"
              onClick={() => void quoteTest.refetch()}
              disabled={quoteTest.isFetching}
            >
              <Activity className={cn(quoteTest.isFetching && "is-spinning")} />
              Run quote diagnostics
            </button>
          </div>
        </div>

        {summary.length > 0 ? (
          <div className="yt-settings-source-summary">
            {summary.map((source) => {
              const view = summaryView(source.status);
              return (
                <article key={source.assetClass}>
                  <div>
                    <span>{source.label}</span>
                    <StatusPill tone={view.tone}>{view.label}</StatusPill>
                  </div>
                  <strong>
                    {source.activeProviderLabel ?? "No active provider"}
                  </strong>
                  <small>
                    {source.sourceLabel ?? "Provider unavailable"}
                    {source.fallbackInUse ? " · fallback disclosed" : ""}
                  </small>
                </article>
              );
            })}
          </div>
        ) : null}

        {healthLoading ? (
          <div className="yt-settings-empty">
            <RefreshCw className="is-spinning" />
            <strong>Running provider health checks</strong>
            <span>
              No connection state is assumed while the endpoint responds.
            </span>
          </div>
        ) : null}
        {healthError ? (
          <div className="yt-settings-empty is-error">
            <WifiOff />
            <strong>Provider health unavailable</strong>
            <span>The application is not claiming a connection.</span>
          </div>
        ) : null}
        {!healthLoading && !healthError ? (
          <div className="yt-settings-provider-list">
            {providers.map((provider) => {
              const view = providerView(provider);
              const ProviderIcon = view.Icon;
              return (
                <article key={provider.id}>
                  <span
                    className={`yt-settings-provider-list__icon is-${view.tone}`}
                  >
                    <ProviderIcon aria-hidden="true" />
                  </span>
                  <div className="yt-settings-provider-list__copy">
                    <div>
                      <strong>{provider.name}</strong>
                      <StatusPill tone={view.tone}>{view.label}</StatusPill>
                      {provider.isTradingCapable ? (
                        <StatusPill tone="negative">Read-only</StatusPill>
                      ) : null}
                    </div>
                    <p>{view.description}</p>
                    <small>
                      {provider.assetClasses.join(" · ") ||
                        "Asset class unavailable"}{" "}
                      · checked {timeAgo(provider.lastCheckedAt)}
                      {provider.latencyMs == null
                        ? ""
                        : ` · ${provider.latencyMs}ms`}
                    </small>
                  </div>
                  <span className="yt-settings-provider-list__source">
                    {provider.sourceLabel}
                  </span>
                </article>
              );
            })}
            {providers.length === 0 ? (
              <div className="yt-settings-empty">
                <Plug />
                <strong>No provider inventory returned</strong>
                <span>
                  Connections remain unavailable until the server reports them.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {quoteTest.isError ? (
            <motion.div
              className="yt-settings-diagnostic is-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion ? 0 : motionTokens.duration.fast,
              }}
            >
              Quote diagnostics failed. No quote source is represented as
              connected.
            </motion.div>
          ) : quoteTest.data ? (
            <motion.div
              className="yt-settings-diagnostics"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: motionTokens.duration.interface,
                      ease: motionTokens.ease.out,
                    }
              }
            >
              <header>
                <strong>Diagnostic result</strong>
                <StatusPill
                  tone={usableQuotes.length > 0 ? "positive" : "gold"}
                >
                  {usableQuotes.length} usable responses
                </StatusPill>
              </header>
              {usableQuotes.length > 0 ? (
                <div>
                  {usableQuotes.map((quote) => {
                    const badge = quoteBadge(quote);
                    return (
                      <span key={`${quote.symbol}-${quote.provider}`}>
                        <strong>{quote.symbol}</strong>
                        <b>${formatPrice(quote.price)}</b>
                        <small>{badge.text}</small>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p>No usable quotes returned. Providers remain unavailable.</p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="yt-settings-truth-policy">
          <div>
            <Radio aria-hidden="true" />
            <span>
              <strong>Market-data truth policy</strong>
              <small>
                Presentation rules are mandatory, not a source-connection
                control.
              </small>
            </span>
          </div>
          <ul>
            <li>
              <span>Source & freshness labels</span>
              <StatusPill tone="positive">Always on</StatusPill>
            </li>
            <li>
              <span>Fallback disclosure</span>
              <StatusPill tone="positive">Required</StatusPill>
            </li>
            <li>
              <span>Unavailable modules</span>
              <StatusPill>Visible</StatusPill>
            </li>
          </ul>
          <p>
            Provider secrets are configured outside the browser. This surface
            never accepts or displays raw keys.
          </p>
        </div>
      </Panel>

      <div className="yt-settings-two-column">
        <Panel
          title="Notifications & alerts"
          eyebrow="Local preference foundation"
          icon={Bell}
          state={<StatusPill>Not persisted</StatusPill>}
        >
          <div className="yt-settings-stack">
            {NOTIFICATION_SETTINGS.map((item, index) => (
              <SettingRow
                key={item.label}
                title={item.label}
                description={item.description}
                action={
                  <Toggle
                    checked={notifications[index] ?? false}
                    onChange={() =>
                      setNotifications((current) =>
                        current.map((value, itemIndex) =>
                          itemIndex === index ? !value : value,
                        ),
                      )
                    }
                    label={item.label}
                    reducedMotion={reducedMotion}
                  />
                }
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Risk thresholds"
          eyebrow="Configuration service"
          icon={Gauge}
          state={
            <StatusPill tone={riskConfig.isDefault ? "neutral" : "positive"}>
              {riskConfig.isDefault
                ? "Defaults"
                : `Updated ${timeAgo(riskConfig.updatedAt ?? null)}`}
            </StatusPill>
          }
        >
          <div className="yt-settings-risk-toolbar">
            <p>Illustrative boundaries are not financial guidance.</p>
            <button
              type="button"
              className="yt-settings-button"
              onClick={() => {
                if (riskEditing) restoreRiskDraft();
                setRiskEditing((current) => !current);
                setRiskMessage(null);
              }}
            >
              <SlidersHorizontal />
              {riskEditing ? "Cancel editing" : "Edit thresholds"}
            </button>
          </div>
          {riskLoading ? (
            <div className="yt-settings-empty">
              <RefreshCw className="is-spinning" />
              <strong>Loading thresholds</strong>
            </div>
          ) : (
            <div className="yt-settings-risk-list">
              {RISK_FIELDS.map((field) => {
                const parsed = Number.parseInt(riskDraft[field.key], 10);
                const invalid =
                  riskEditing &&
                  (!Number.isFinite(parsed) || parsed < 1 || parsed > 100);
                const dirty = riskEditing && parsed !== riskConfig[field.key];
                return (
                  <SettingRow
                    key={field.key}
                    title={field.label}
                    description={field.description}
                    action={
                      riskEditing ? (
                        <label
                          className={cn(
                            "yt-settings-risk-input",
                            invalid && "is-invalid",
                            dirty && "is-dirty",
                          )}
                        >
                          <span className="sr-only">{field.label} percent</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={riskDraft[field.key]}
                            onChange={(event) =>
                              setRiskDraft((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                          />
                          <span>%</span>
                        </label>
                      ) : (
                        <strong className="yt-settings-risk-value">
                          {riskConfig[field.key]}%
                        </strong>
                      )
                    }
                  />
                );
              })}
            </div>
          )}
          <AnimatePresence initial={false}>
            {riskEditing ? (
              <motion.div
                className="yt-settings-risk-editor"
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        duration: motionTokens.duration.interface,
                        ease: motionTokens.ease.out,
                      }
                }
              >
                {riskMessage ? (
                  <p
                    className={cn(
                      "yt-settings-message",
                      riskMessage.ok ? "is-success" : "is-error",
                    )}
                    role="status"
                  >
                    {riskMessage.text}
                  </p>
                ) : null}
                <div>
                  <button
                    type="button"
                    className="yt-settings-button is-primary"
                    onClick={() => void saveRiskConfig()}
                    disabled={updateRisk.isPending || !riskDraftValid()}
                  >
                    {updateRisk.isPending ? (
                      <RefreshCw className="is-spinning" />
                    ) : (
                      <Save />
                    )}
                    Save thresholds
                  </button>
                  <button
                    type="button"
                    className="yt-settings-button"
                    onClick={resetRiskToDefaults}
                    disabled={updateRisk.isPending}
                  >
                    <RotateCcw />
                    Load defaults
                  </button>
                </div>
                <small>
                  Values must be 1–100. A successful response confirms only the
                  current configuration service.
                </small>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Panel>
      </div>

      <div className="yt-settings-two-column is-preferences">
        <Panel
          title="Display, appearance & motion"
          eyebrow="This device"
          icon={Moon}
          state={<StatusPill>Local</StatusPill>}
        >
          <SettingRow
            title="Display density"
            description="Adjusts this Settings command center only."
            action={
              <div className="yt-settings-segmented">
                <button
                  type="button"
                  className={
                    density === "comfortable" ? "is-active" : undefined
                  }
                  onClick={() => setDensity("comfortable")}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  className={density === "compact" ? "is-active" : undefined}
                  onClick={() => setDensity("compact")}
                >
                  Compact
                </button>
              </div>
            }
          />
          <SettingRow
            title="Appearance"
            description="The approved Meridian dark system remains fixed."
            action={
              <span className="yt-settings-inline-state">
                <Moon />
                Meridian dark
              </span>
            }
          />
          <SettingRow
            title="Motion"
            description="Follows the browser and operating-system preference."
            action={
              <StatusPill tone={reducedMotion ? "gold" : "positive"}>
                {reducedMotion ? "Reduced" : "Full"}
              </StatusPill>
            }
          />
          <SettingRow
            title="Ambient movement"
            description={
              reducedMotion
                ? "Parallax and drift are removed."
                : "Calm shell transitions are enabled."
            }
            action={<Move aria-hidden="true" />}
          />
        </Panel>

        <Panel
          title="Charts & watchlists"
          eyebrow="Workspace preferences"
          icon={BarChart3}
          state={<StatusPill>Local preview</StatusPill>}
        >
          {[
            ["Moving averages", "Show the approved MA 8 and MA 21 context."],
            ["Volume context", "Preserve the analytical volume band."],
            [
              "Dense chart labels",
              "A local preview preference; not persisted.",
            ],
          ].map(([title, description], index) => (
            <SettingRow
              key={title}
              title={title}
              description={description}
              action={
                <Toggle
                  checked={chartPreferences[index] ?? false}
                  onChange={() =>
                    setChartPreferences((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? !value : value,
                      ),
                    )
                  }
                  label={title}
                  reducedMotion={reducedMotion}
                />
              }
            />
          ))}
          <SettingRow
            title="Watchlist organization"
            description="Editing and cloud synchronization are deferred."
            action={<StatusPill>Foundation</StatusPill>}
          />
        </Panel>
      </div>

      <div className="yt-settings-three-column">
        <Panel
          title="Privacy & data controls"
          eyebrow="Fail-closed foundation"
          icon={Shield}
          state={<StatusPill>Unavailable</StatusPill>}
        >
          <p className="yt-settings-lead">
            No export or deletion job is connected. Actions stay disabled until
            server contracts and confirmation flows are approved.
          </p>
          <div className="yt-settings-disabled-actions">
            <button type="button" disabled>
              <Download />
              Export account data
            </button>
            <button type="button" disabled>
              <Trash2 />
              Request deletion
            </button>
          </div>
          <SettingRow
            title="Browser secrets"
            description="Raw provider credentials are never accepted here."
            action={<Check />}
          />
        </Panel>

        <Panel
          title="Audit activity"
          eyebrow="Security-safe visibility"
          icon={FileText}
          state={<StatusPill>Foundation</StatusPill>}
        >
          <div className="yt-settings-audit-list">
            <div>
              <span>
                <User />
              </span>
              <p>
                <strong>Session identity</strong>
                <small>Resolved by the authentication service</small>
              </p>
            </div>
            <div>
              <span>
                <Lock />
              </span>
              <p>
                <strong>Mutation boundary</strong>
                <small>CSRF-protected server requests</small>
              </p>
            </div>
            <div>
              <span>
                <Eye />
              </span>
              <p>
                <strong>Secret handling</strong>
                <small>No raw tokens or keys shown</small>
              </p>
            </div>
          </div>
          <p className="yt-settings-note">
            A persistent, user-visible audit timeline is not implemented.
          </p>
        </Panel>

        <Panel
          title="Application & integrations"
          eyebrow="Build information"
          icon={Info}
          state={<StatusPill tone="gold">UI-2.1</StatusPill>}
        >
          <div className="yt-settings-integration-list">
            <SettingRow
              title="Authentication"
              description="Opaque session foundation"
              action={<StatusPill tone="positive">Available</StatusPill>}
            />
            <SettingRow
              title="Market providers"
              description="Health endpoint status"
              action={
                <StatusPill tone={health ? "cyan" : "neutral"}>
                  {health ? "Reported" : "Unavailable"}
                </StatusPill>
              }
            />
            <SettingRow
              title="Production AI"
              description="No model provider connected"
              action={<Bot aria-hidden="true" />}
            />
            <SettingRow
              title="Brokerage"
              description="No execution or custody connection"
              action={<WifiOff aria-hidden="true" />}
            />
            <SettingRow
              title="Database persistence"
              description="Not asserted by this UI phase"
              action={<Database aria-hidden="true" />}
            />
            <SettingRow
              title="Build metadata"
              description="No runtime build identifier injected"
              action={<Server aria-hidden="true" />}
            />
          </div>
        </Panel>
      </div>

      <motion.footer className="yt-settings-footer" variants={panelReveal}>
        <div>
          <span className="yt-settings-footer__mark">YT</span>
          <p>
            <strong>YucaTanaTrades</strong>
            <small>Meridian OS · UI-2.1 experience foundation</small>
          </p>
        </div>
        <p>
          <Layers aria-hidden="true" />
          No live execution, brokerage, production AI, or database persistence
          is claimed.
        </p>
      </motion.footer>
    </motion.main>
  );
}
