import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { Redirect, Route, Router as WouterRouter, Switch } from "wouter";
import { AuthProvider, useAuth } from "@/auth/auth-provider";
import {
  AnonymousOnlyRoute,
  AuthServiceRoute,
  ProtectedRoute,
} from "@/auth/auth-guards";
import { AppShell } from "@/components/app-shell";
import { AuthEntryTransition } from "@/components/auth/auth-entry-transition";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import PublicLandingPage from "@/pages/public-landing";
import Scanners from "@/pages/scanners";
import Bots from "@/pages/bots";
import Journal from "@/pages/journal";
import Risk from "@/pages/risk";
import Settings from "@/pages/settings";
import Watchlist from "@/pages/watchlist";
import NotFound from "@/pages/not-found";
import SignInPage from "@/pages/sign-in";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";
import { ChartsRoute } from "@/pages/charts-ui2";
import { MarketsRoute } from "@/pages/markets-ui2";
import {
  AIHubRoute,
  NewsRoute,
  PortfolioRoute,
  ResearchRoute,
} from "@/pages/intelligence-routes-ui2";
import { UtilityStatusRoute } from "@/pages/utility-status-route";
import {
  utilityAvailabilityForSession,
  utilityRoutes,
  workspaceRoutes,
  type ImplementedUtilityRouteId,
  type UtilityRoute as UtilityRouteDefinition,
  type WorkspaceRouteId,
} from "@/navigation/workspace-navigation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const workspaceRouteComponents = {
  overview: Home,
  markets: MarketsRoute,
  charts: ChartsRoute,
  portfolio: PortfolioRoute,
  research: ResearchRoute,
  news: NewsRoute,
  "ai-hub": AIHubRoute,
} satisfies Record<WorkspaceRouteId, ComponentType>;

const utilityRouteComponents = {
  scan: Scanners,
  watchlist: Watchlist,
  journal: Journal,
  settings: Settings,
  bots: Bots,
  risk: Risk,
} satisfies Record<ImplementedUtilityRouteId, ComponentType>;

function UtilityRoute({ route }: { route: UtilityRouteDefinition }) {
  const { state } = useAuth();
  const sessionType =
    state.kind === "authenticated" ? state.session.sessionType : "guest";
  const availability = utilityAvailabilityForSession(route, sessionType);

  if (availability !== "available") {
    return <UtilityStatusRoute route={route} reason={availability} />;
  }

  const Component =
    utilityRouteComponents[route.id as ImplementedUtilityRouteId];
  return <Component />;
}

function WorkspaceRoutes() {
  return (
    <AppShell>
      <Switch>
        {workspaceRoutes.flatMap((route) => {
          const Component = workspaceRouteComponents[route.id];
          return [route.href, ...route.aliases].map((path) => (
            <Route key={path} path={path}>
              <Component />
            </Route>
          ));
        })}
        {utilityRoutes.map((route) => (
          <Route key={route.href} path={route.href}>
            <UtilityRoute route={route} />
          </Route>
        ))}
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function PublicHomeRoute() {
  const { state } = useAuth();

  if (state.kind === "authenticated") {
    return <Redirect to="/overview" replace />;
  }

  return <PublicLandingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicHomeRoute />
      </Route>
      <Route path="/sign-in">
        <AnonymousOnlyRoute><SignInPage /></AnonymousOnlyRoute>
      </Route>
      <Route path="/register">
        <AnonymousOnlyRoute><RegisterPage /></AnonymousOnlyRoute>
      </Route>
      <Route path="/forgot-password">
        <AnonymousOnlyRoute><ForgotPasswordPage /></AnonymousOnlyRoute>
      </Route>
      <Route path="/reset-password">
        <AuthServiceRoute><ResetPasswordPage /></AuthServiceRoute>
      </Route>
      <Route path="/verify-email">
        <AuthServiceRoute><VerifyEmailPage /></AuthServiceRoute>
      </Route>
      <Route>
        <ProtectedRoute><WorkspaceRoutes /></ProtectedRoute>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <AuthEntryTransition />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}
