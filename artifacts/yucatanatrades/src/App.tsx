import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppShell } from "@/components/app-shell";
import { TickerTape } from "@/components/ticker-tape";
import { AnimatedBackground } from "@/components/animated-background";
import { ParticleField } from "@/components/particle-field";

import Home from "@/pages/home";
import Markets from "@/pages/markets";
import Scanners from "@/pages/scanners";
import Research from "@/pages/research";
import Portfolio from "@/pages/portfolio";
import Bots from "@/pages/bots";
import Journal from "@/pages/journal";
import Risk from "@/pages/risk";
import Settings from "@/pages/settings";
import Watchlist from "@/pages/watchlist";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/markets" component={Markets} />
        <Route path="/scanners" component={Scanners} />
        <Route path="/research" component={Research} />
        <Route path="/portfolio" component={Portfolio} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AnimatedBackground />
          <ParticleField />
          <div className="flex flex-col h-screen overflow-hidden relative z-10">
            <TickerTape />
            <div className="flex-1 relative min-h-0">
              <Router />
            </div>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
