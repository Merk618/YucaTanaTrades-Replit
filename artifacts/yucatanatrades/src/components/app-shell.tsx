import * as React from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LineChart,
  Radar,
  Bot,
  TerminalSquare,
  Briefcase,
  BookOpen,
  ShieldAlert,
  Settings,
  Menu,
  Search,
  Bell,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "Markets", href: "/markets", icon: LineChart },
  { name: "Scanners", href: "/scanners", icon: Radar },
  { name: "Research", href: "/research", icon: TerminalSquare },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Bots", href: "/bots", icon: Bot },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Watchlist", href: "/watchlist", icon: Star },
  { name: "Risk", href: "/risk", icon: ShieldAlert },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        className="flex-shrink-0 border-r border-border/50 bg-sidebar/95 backdrop-blur z-20 flex flex-col"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground">YT</span>
              </div>
              <span className="font-display font-bold text-lg text-primary tracking-tight">
                YucaTana
              </span>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground">YT</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer group relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {isSidebarOpen && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur z-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickers, commands, settings..."
                className="w-full bg-muted/50 border border-border/50 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono"
              />
              <div className="absolute right-2 top-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                ⌘K
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-medium text-sm">
              TX
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="absolute inset-0 p-6">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full max-w-[1600px] mx-auto"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
