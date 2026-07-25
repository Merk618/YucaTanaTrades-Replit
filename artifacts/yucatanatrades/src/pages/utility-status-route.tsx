import { ArrowLeft, CloudOff, DatabaseZap, PauseCircle } from "lucide-react";
import { Link } from "wouter";
import type { UtilityRoute } from "@/navigation/workspace-navigation";

export function UtilityStatusRoute({
  route,
  reason,
}: {
  route: UtilityRoute;
  reason: "deferred" | "persistent_user_required";
}) {
  const persistentUserRequired = reason === "persistent_user_required";
  const Icon = persistentUserRequired ? DatabaseZap : PauseCircle;
  const availability = persistentUserRequired
    ? "Unavailable in Local review"
    : route.status;

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
            {persistentUserRequired
              ? "Persistent user session required"
              : "Capability deferred"}
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
                  : "No provider request"}
              </dd>
            </div>
          </dl>
          <Link className="yt-utility-return" href={route.recoveryHref}>
            <ArrowLeft aria-hidden="true" />
            Return to Overview
          </Link>
        </div>
      </section>
    </div>
  );
}
