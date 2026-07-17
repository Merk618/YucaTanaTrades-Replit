import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { AuthProvider } from "@/auth/auth-provider";
import {
  AnonymousOnlyRoute,
  AuthServiceRoute,
  ProtectedRoute,
} from "@/auth/auth-guards";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function WorkspaceRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/markets"><MarketsRoute /></Route>
        <Route path="/markets/stocks"><MarketsRoute /></Route>
        <Route path="/markets/crypto"><MarketsRoute /></Route>
        <Route path="/charts"><ChartsRoute /></Route>
        <Route path="/portfolio"><PortfolioRoute /></Route>
        <Route path="/research"><ResearchRoute /></Route>
        <Route path="/news"><NewsRoute /></Route>
        <Route path="/ai-lab"><AIHubRoute /></Route>
        <Route path="/scanners" component={Scanners} />
        <Route path="/bots" component={Bots} />
        <Route path="/journal" component={Journal} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/risk" component={Risk} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
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
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}
