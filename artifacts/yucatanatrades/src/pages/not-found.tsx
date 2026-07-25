import { ArrowLeft, SearchX } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div className="yt-preview-route yt-unavailable-route yt-utility-status-route">
      <header className="yt-preview-route-heading">
        <div>
          <span>Meridian OS · Route status</span>
          <h1>Workspace not found</h1>
          <p>The requested destination is not registered in Meridian OS.</p>
        </div>
        <span className="yt-state-pill is-unavailable">404</span>
      </header>
      <section
        className="yt-unavailable-stage yt-utility-status-stage"
        aria-labelledby="yt-route-not-found-title"
      >
        <div className="yt-unavailable-orbit" aria-hidden="true">
          <SearchX />
        </div>
        <div>
          <span className="yt-state-pill is-unavailable">Unavailable route</span>
          <h2 id="yt-route-not-found-title">
            This route is outside the registered workspace
          </h2>
          <p>
            No fallback data or substitute feature has been loaded for{" "}
            <code>{location}</code>.
          </p>
          <Link className="yt-utility-return" href="/overview">
            <ArrowLeft aria-hidden="true" />
            Return to Overview
          </Link>
        </div>
      </section>
    </div>
  );
}
