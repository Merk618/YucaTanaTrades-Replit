import { ArrowLeft, CloudOff, DatabaseZap, PauseCircle } from "lucide-react";
import { Link } from "wouter";
import type { UtilityRoute } from "@/navigation/workspace-navigation";

export function UtilityStatusRoute({
  route,
  reason,
}: {
  route: UtilityRoute;
  reason:
    | "deferred"
    | "provider_unavailable"
    | "persistent_user_required";
}) {
  const persistentUserRequired = reason === "persistent_user_required";
  const providerUnavailable = reason === "provider_unavailable";
  const Icon = persistentUserRequired
    ? DatabaseZap
    : providerUnavailable
      ? CloudOff
      : PauseCircle;
  const availability = persistentUserRequired
    ? "Unavailable in Local review"
    : route.status;
  const providerDetails =
    route.access === "provider_unavailable"
      ? {
          providerClass: route.providerClass,
          providerState: route.providerState,
          configurationLocation: route.configurationLocation,
        }
      : null;
  const boundaryLabel = persistentUserRequired
    ? "Review Access restricted"
    : providerUnavailable
      ? "Provider unavailable"
      : "Capability deferred";

  return (
    <div className="yt-preview-route yt-unavailable-route yt-utility-status-route">
      <header className="yt-preview-route-heading">
        <div>
          <span>Meridian OS · Utility status</span>
          <h1>{route.label}</h1>
          <p>{route.description}</p>
        </div>
        <span className="yt-state-pill is-unavailable">{availability}</span>
      </header>

      <section
        className="yt-unavailable-stage yt-utility-status-stage"
        aria-labelledby={`yt-utility-${route.id}-title`}
      >
        <div className="yt-unavailable-orbit" aria-hidden="true">
          <Icon />
        </div>
        <CloudOff className="yt-utility-status-watermark" aria-hidden="true" />
        <div>
          <span className="yt-state-pill is-unavailable">
            {boundaryLabel}
          </span>
          <h2 id={`yt-utility-${route.id}-title`}>{route.title}</h2>
          <p>{route.description}</p>
          <dl className="yt-utility-truth-list">
            <div>
              <dt>Availability</dt>
              <dd>{availability}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>No fabricated results</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>
                {persistentUserRequired
                  ? "Local review · persistence none"
                  : providerUnavailable
                    ? "No provider request"
                    : "No service request"}
              </dd>
            </div>
          </dl>
          <div className="yt-utility-boundary-detail">
            <article>
              <span>Current boundary</span>
              <h3>Why this utility is unavailable</h3>
              <p>{route.description}</p>
              {providerUnavailable && providerDetails ? (
                <>
                  <p><strong>Provider class:</strong> {providerDetails.providerClass}</p>
                  <p><strong>Provider state:</strong> {providerDetails.providerState}</p>
                  <p><strong>Configuration:</strong> {providerDetails.configurationLocation}</p>
                </>
              ) : null}
            </article>
            <article>
              <span>Available now and next</span>
              <h3>What remains available</h3>
              <p>{route.availableNow}</p>
              <p><strong>Future capability:</strong> {route.futureCapability}</p>
            </article>
          </div>
          <div className="yt-utility-actions">
            <Link className="yt-utility-return" href={route.recoveryHref}>
              <ArrowLeft aria-hidden="true" />
              Return to Overview
            </Link>
            {route.alternativeHref !== route.recoveryHref ? (
              <Link
                className="yt-utility-return is-secondary"
                href={route.alternativeHref}
              >
                {route.alternativeLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
