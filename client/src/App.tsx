/**
 * Courtyard Atlas design reminder: keep the global shell quiet, editorial, and route-like.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessWorkspace } from "@/lib/workspaceAccess";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import React, { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ModeratorAccess from "./pages/ModeratorAccess";
import Operations from "./pages/Operations";

function ProtectedWorkspaceRoute({ allowedRoles, children }: { allowedRoles: readonly string[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isAllowed = canAccessWorkspace(user?.role, allowedRoles);

  useEffect(() => {
    if (!loading && !isAllowed) {
      setLocation("/", { replace: true });
    }
  }, [isAllowed, loading, setLocation]);

  if (loading) {
    return <main className="operations-page" aria-busy="true" />;
  }

  return isAllowed ? <>{children}</> : null;
}

function AdminRoute() {
  return <ProtectedWorkspaceRoute allowedRoles={["admin"]}><Admin /></ProtectedWorkspaceRoute>;
}

function OperationsRoute() {
  const { user, loading } = useAuth();
  if (loading) return <main className="operations-page" aria-busy="true" />;
  return canAccessWorkspace(user?.role, ["admin", "moderator"]) ? <Operations /> : <ModeratorAccess />;
}

function AgentOnboardingRoute() {
  return <Home startAgentOpen />;
}

function MarketplaceRoute() {
  return <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MarketplaceRoute} />
      <Route path="/agent" component={AgentOnboardingRoute} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/operations" component={OperationsRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
