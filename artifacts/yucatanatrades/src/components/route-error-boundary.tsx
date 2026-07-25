import * as React from "react";
import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react";
import { Link } from "wouter";

interface RouteErrorBoundaryProps {
  route: string;
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export function RouteFailureSurface({
  route,
  onReload,
}: {
  route: string;
  onReload: () => void;
}) {
  return (
    <section
      className="yt-route-failure"
      role="alert"
      aria-labelledby="yt-route-failure-title"
    >
      <span className="yt-route-failure-icon" aria-hidden="true">
        <AlertTriangle />
      </span>
      <div>
        <span>Meridian OS · Route recovery</span>
        <h1 id="yt-route-failure-title">This workspace could not be opened</h1>
        <p>
          The rest of Meridian OS is still available. No stack trace or
          sensitive runtime detail is shown here.
        </p>
        <code>{route}</code>
        <div className="yt-route-failure-actions">
          <Link href="/overview">
            <ArrowLeft aria-hidden="true" />
            Return to Overview
          </Link>
          <button type="button" onClick={onReload}>
            <RotateCw aria-hidden="true" />
            Reload route
          </button>
        </div>
      </div>
    </section>
  );
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(
        "[Meridian OS] Route render failure",
        error,
        info.componentStack,
      );
    }
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (
      this.state.hasError &&
      previousProps.route !== this.props.route
    ) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <RouteFailureSurface
          route={this.props.route}
          onReload={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
