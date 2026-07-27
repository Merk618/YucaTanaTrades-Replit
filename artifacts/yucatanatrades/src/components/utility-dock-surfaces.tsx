import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  CircleHelp,
  Clock3,
  Eye,
  LockKeyhole,
  Radar,
  Settings2,
  ShieldCheck,
  WifiOff,
  X,
} from "lucide-react";
import { useAuth } from "@/auth/auth-provider";
import { dashboardDemo } from "@/data/ui1-demo";

export const compactUtilitySurfaceIds = [
  "scan",
  "watchlist",
  "alerts",
  "help",
] as const;

export type CompactUtilitySurfaceId =
  (typeof compactUtilitySurfaceIds)[number];

export function isCompactUtilitySurfaceId(
  value: string,
): value is CompactUtilitySurfaceId {
  return compactUtilitySurfaceIds.includes(
    value as CompactUtilitySurfaceId,
  );
}

interface UtilityPanelBodyProps {
  surface: CompactUtilitySurfaceId;
  reviewSession: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}

function SurfaceEyebrow({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="yt-utility-surface-eyebrow">
      <Icon aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function SurfaceActions({
  primaryLabel,
  primaryHref,
  onClose,
  onNavigate,
}: {
  primaryLabel: string;
  primaryHref: string;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="yt-utility-surface-actions">
      <button
        type="button"
        className="yt-utility-surface-action is-primary"
        onClick={() => onNavigate(primaryHref)}
      >
        {primaryLabel}
        <ArrowRight aria-hidden="true" />
      </button>
      <button
        type="button"
        className="yt-utility-surface-action"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

function ScanPanel({
  reviewSession,
  onClose,
  onNavigate,
}: Omit<UtilityPanelBodyProps, "surface">) {
  return (
    <div className="yt-utility-surface-body" data-utility-surface="scan">
      <SurfaceEyebrow icon={LockKeyhole}>
        {reviewSession
          ? "Review Access boundary"
          : "Scanner command foundation"}
      </SurfaceEyebrow>
      <div className="yt-utility-capability-card is-restricted">
        <span>Capability state</span>
        <strong>
          {reviewSession
            ? "Persistent-user scanning is unavailable"
            : "Scanner workspace available"}
        </strong>
        <p>
          {reviewSession
            ? "Local Review Access has no persistent user record and does not request saved scans or provider-backed results."
            : "Open the scanner workspace to review user-owned definitions within the current provider boundary."}
        </p>
      </div>

      <section className="yt-utility-surface-section" aria-labelledby="yt-scan-demo-title">
        <div className="yt-utility-surface-section-head">
          <div>
            <span>Available now</span>
            <h3 id="yt-scan-demo-title">Fixed Demo context</h3>
          </div>
          <small>Not scan results</small>
        </div>
        <div className="yt-utility-demo-list">
          {dashboardDemo.opportunities.items.map((item) => (
            <article key={item.symbol}>
              <span className="yt-utility-demo-rank">
                {String(item.rank).padStart(2, "0")}
              </span>
              <span>
                <strong>{item.symbol}</strong>
                <small>{item.company}</small>
              </span>
              <em>Demo context</em>
            </article>
          ))}
        </div>
        <p className="yt-utility-surface-note">
          Deterministic UI fixture only. No market-data, scanner, or persistent-user request is made.
        </p>
      </section>

      <SurfaceActions
        primaryLabel={reviewSession ? "Review Markets" : "Open scanner workspace"}
        primaryHref={reviewSession ? "/markets" : "/scanners"}
        onClose={onClose}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function WatchlistPanel({
  reviewSession,
  onClose,
  onNavigate,
}: Omit<UtilityPanelBodyProps, "surface">) {
  return (
    <div className="yt-utility-surface-body" data-utility-surface="watchlist">
      <SurfaceEyebrow icon={Eye}>Temporary market context</SurfaceEyebrow>
      <div className="yt-utility-capability-card">
        <span>Local Demo · not saved</span>
        <strong>
          {reviewSession
            ? "Review Access has no owned watchlist"
            : "Preview before opening the saved workspace"}
        </strong>
        <p>
          These rows come from the fixed Overview fixture. They do not represent saved user data, current quotes, or a connected provider.
        </p>
      </div>

      <section className="yt-utility-surface-section" aria-labelledby="yt-watchlist-demo-title">
        <div className="yt-utility-surface-section-head">
          <div>
            <span>Fixed snapshot</span>
            <h3 id="yt-watchlist-demo-title">Demo watchlist</h3>
          </div>
          <small>Historical Demo</small>
        </div>
        <div className="yt-utility-watchlist">
          {dashboardDemo.watchlist.items.map((item) => (
            <article key={item.id}>
              <span>
                <strong>{item.symbol}</strong>
                <small>{item.company}</small>
              </span>
              <span>
                <strong>{item.displayPrice}</strong>
                <small className={item.direction === "down" ? "is-negative" : "is-positive"}>
                  {item.changePercent > 0 ? "+" : ""}
                  {item.changePercent.toFixed(2)}% · Demo
                </small>
              </span>
            </article>
          ))}
        </div>
      </section>

      <SurfaceActions
        primaryLabel={reviewSession ? "Open Charts" : "Open watchlist workspace"}
        primaryHref={reviewSession ? "/charts" : "/watchlist"}
        onClose={onClose}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function AlertsPanel({
  onClose,
  onNavigate,
}: Omit<UtilityPanelBodyProps, "surface" | "reviewSession">) {
  const alertStates = [
    {
      icon: WifiOff,
      label: "Monitoring",
      state: "Not configured",
      detail: "No background market monitor is active.",
    },
    {
      icon: Bell,
      label: "Delivery",
      state: "Unavailable",
      detail: "No push, email, or device channel is connected.",
    },
    {
      icon: ShieldCheck,
      label: "Rules",
      state: "No owned rules",
      detail: "Review Access does not load persistent alert definitions.",
    },
  ];

  return (
    <div className="yt-utility-surface-body" data-utility-surface="alerts">
      <SurfaceEyebrow icon={Bell}>Notification center</SurfaceEyebrow>
      <div className="yt-utility-empty-state">
        <span className="yt-utility-empty-icon"><Bell aria-hidden="true" /></span>
        <strong>No alert events are shown</strong>
        <p>
          Monitoring and delivery providers are not configured. Meridian OS does not fabricate alerts or imply background evaluation.
        </p>
      </div>
      <div className="yt-utility-alert-states" aria-label="Alert capability states">
        {alertStates.map((item) => (
          <article key={item.label}>
            <item.icon aria-hidden="true" />
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
            <em>{item.state}</em>
          </article>
        ))}
      </div>
      <SurfaceActions
        primaryLabel="Review notification settings"
        primaryHref="/settings"
        onClose={onClose}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function HelpPanel({
  onClose,
  onNavigate,
}: Omit<UtilityPanelBodyProps, "surface" | "reviewSession">) {
  return (
    <div className="yt-utility-surface-body" data-utility-surface="help">
      <SurfaceEyebrow icon={CircleHelp}>Meridian guidance</SurfaceEyebrow>
      <div className="yt-utility-help-grid">
        <article>
          <Radar aria-hidden="true" />
          <span>
            <strong>Workspace navigator</strong>
            <small>Press Ctrl/⌘ K to move between primary workspaces.</small>
          </span>
        </article>
        <article>
          <BookOpen aria-hidden="true" />
          <span>
            <strong>Truth labels</strong>
            <small>Demo, Historical, AI-generated, and Unavailable states remain explicit.</small>
          </span>
        </article>
        <article>
          <Clock3 aria-hidden="true" />
          <span>
            <strong>Review sessions</strong>
            <small>Local Review Access is temporary, server-side, and expires automatically.</small>
          </span>
        </article>
        <article>
          <Check aria-hidden="true" />
          <span>
            <strong>Keyboard access</strong>
            <small>Tab moves through controls; Escape closes this panel.</small>
          </span>
        </article>
      </div>
      <div className="yt-utility-capability-card">
        <span>Support state</span>
        <strong>Documentation provider deferred</strong>
        <p>
          No support availability or response time is implied in this local review. Route-level capability notes remain available now.
        </p>
      </div>
      <SurfaceActions
        primaryLabel="Open Settings"
        primaryHref="/settings"
        onClose={onClose}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function UtilityPanelBody(props: UtilityPanelBodyProps) {
  if (props.surface === "scan") return <ScanPanel {...props} />;
  if (props.surface === "watchlist") return <WatchlistPanel {...props} />;
  if (props.surface === "alerts") return <AlertsPanel {...props} />;
  return <HelpPanel {...props} />;
}

interface UtilityDockSurfacesProps {
  surface: CompactUtilitySurfaceId | null;
  onClose: () => void;
  onNavigate: (href: string) => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

export function UtilityDockSurfaces({
  surface,
  onClose,
  onNavigate,
  returnFocusRef,
}: UtilityDockSurfacesProps) {
  const { state } = useAuth();
  const reviewSession =
    state.kind === "authenticated" &&
    state.session.sessionType === "development_review";

  const restoreTriggerFocus = (event: Event) => {
    event.preventDefault();
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  const navigateFromSurface = (href: string) => {
    onClose();
    onNavigate(href);
  };

  return (
    <>
      <DialogPrimitive.Root
        open={surface === "scan"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="yt-utility-surface-backdrop" />
          <DialogPrimitive.Content
            className="yt-utility-sheet yt-utility-sheet--scan"
            onCloseAutoFocus={restoreTriggerFocus}
          >
            <DialogPrimitive.Close className="yt-utility-surface-close" aria-label="Close Scan command">
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
            <div className="yt-utility-surface-heading">
              <DialogPrimitive.Title>Scan command</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                A focused scanner boundary with fixed Demo context.
              </DialogPrimitive.Description>
            </div>
            <UtilityPanelBody
              surface="scan"
              reviewSession={reviewSession}
              onClose={onClose}
              onNavigate={navigateFromSurface}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root
        open={surface === "watchlist"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="yt-utility-surface-backdrop" />
          <DialogPrimitive.Content
            className="yt-utility-sheet yt-utility-sheet--watchlist"
            onCloseAutoFocus={restoreTriggerFocus}
          >
            <DialogPrimitive.Close className="yt-utility-surface-close" aria-label="Close Watchlist context">
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
            <div className="yt-utility-surface-heading">
              <DialogPrimitive.Title>Watchlist context</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                Fixed local rows with no persistence or provider claim.
              </DialogPrimitive.Description>
            </div>
            <UtilityPanelBody
              surface="watchlist"
              reviewSession={reviewSession}
              onClose={onClose}
              onNavigate={navigateFromSurface}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root
        open={surface === "alerts"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="yt-utility-surface-backdrop" />
          <DialogPrimitive.Content
            className="yt-utility-dialog yt-utility-dialog--alerts"
            onCloseAutoFocus={restoreTriggerFocus}
          >
            <DialogPrimitive.Close className="yt-utility-surface-close" aria-label="Close Alerts">
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
            <div className="yt-utility-surface-heading">
              <DialogPrimitive.Title>Alerts</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                Compact capability center; no alert events are fabricated.
              </DialogPrimitive.Description>
            </div>
            <UtilityPanelBody
              surface="alerts"
              reviewSession={reviewSession}
              onClose={onClose}
              onNavigate={navigateFromSurface}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root
        open={surface === "help"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="yt-utility-surface-backdrop" />
          <DialogPrimitive.Content
            className="yt-utility-dialog yt-utility-dialog--help"
            onCloseAutoFocus={restoreTriggerFocus}
          >
            <DialogPrimitive.Close className="yt-utility-surface-close" aria-label="Close Help and guidance">
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
            <div className="yt-utility-surface-heading">
              <DialogPrimitive.Title>Help &amp; guidance</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                Local product guidance within explicit support boundaries.
              </DialogPrimitive.Description>
            </div>
            <UtilityPanelBody
              surface="help"
              reviewSession={reviewSession}
              onClose={onClose}
              onNavigate={navigateFromSurface}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
