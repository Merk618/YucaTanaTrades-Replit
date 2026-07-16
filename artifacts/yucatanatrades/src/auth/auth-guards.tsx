import * as React from "react";
import type { ReactNode } from "react";
import { Redirect, useLocation, useSearch } from "wouter";
import { useAuth } from "./auth-provider";
import {
  protectedReturnDestination,
  returnToFromSearch,
  signInHrefFor,
} from "./return-to";
import {
  AuthLoadingSurface,
  AuthUnavailableSurface,
} from "@/components/auth/auth-status-surface";

function ServiceBoundary({ children }: { children: ReactNode }) {
  const { state, refresh } = useAuth();
  if (state.kind === "loading") return <AuthLoadingSurface />;
  if (state.kind === "unavailable") {
    return <AuthUnavailableSurface message={state.message} onRetry={() => void refresh()} />;
  }
  return children;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { state, validateSession } = useAuth();
  const [location] = useLocation();
  const search = useSearch();
  const [validatedLocation, setValidatedLocation] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    let active = true;
    setValidatedLocation(null);
    void validateSession().finally(() => {
      if (active) setValidatedLocation(location);
    });
    return () => {
      active = false;
    };
  }, [location, validateSession]);

  if (validatedLocation !== location) return <AuthLoadingSurface />;

  if (state.kind === "loading" || state.kind === "unavailable") {
    return <ServiceBoundary>{children}</ServiceBoundary>;
  }
  if (state.kind === "authenticated") return children;

  const destination = protectedReturnDestination(
    location,
    search,
    typeof window === "undefined" ? "" : window.location.hash,
  );
  return <Redirect to={signInHrefFor(destination, state.kind === "expired")} replace />;
}

export function AnonymousOnlyRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const search = useSearch();

  if (state.kind === "loading" || state.kind === "unavailable") {
    return <ServiceBoundary>{children}</ServiceBoundary>;
  }
  if (state.kind === "authenticated") {
    return <Redirect to={returnToFromSearch(search)} replace />;
  }
  return children;
}

export function AuthServiceRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const blocked = state.kind === "loading" || state.kind === "unavailable";

  return (
    <>
      <div
        className="yt-auth-service-content"
        hidden={blocked}
        aria-hidden={blocked || undefined}
      >
        {children}
      </div>
      {blocked ? <ServiceBoundary>{null}</ServiceBoundary> : null}
    </>
  );
}
