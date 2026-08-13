/**
 * Courtyard Atlas design reminder: keep the global shell quiet, editorial, and route-like.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessWorkspace } from "@/lib/workspaceAccess";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, useRoute } from "wouter";
import React, { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeToggle } from "./components/ThemeToggle";
import { CommissionLedgerCsvExport } from "./components/CommissionLedgerCsvExport";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminAccess from "./pages/AdminAccess";
import ModeratorAccess from "./pages/ModeratorAccess";
import Operations from "./pages/Operations";
import OperationsBatches from "./pages/OperationsBatches";

function AuthenticatedWorkspace({ allowedRoles, children, accessPanel }: { allowedRoles: readonly string[]; children: React.ReactNode; accessPanel: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isAllowed = canAccessWorkspace(user?.role, allowedRoles);

  if (loading) {
    return <main className="operations-page" aria-busy="true" />;
  }

  return isAllowed ? <>{children}</> : <>{accessPanel}</>;
}

function AdminRoute() {
  return <AuthenticatedWorkspace allowedRoles={["admin"]} accessPanel={<AdminAccess />}><Admin /></AuthenticatedWorkspace>;
}

function OperationsRoute() {
  const { user, loading } = useAuth();
  if (loading) return <main className="operations-page" aria-busy="true" />;
  return canAccessWorkspace(user?.role, ["admin", "moderator"]) ? <Operations /> : <ModeratorAccess />;
}

function OperationsBatchesRoute() {
  return <AuthenticatedWorkspace allowedRoles={["admin", "moderator"]} accessPanel={<ModeratorAccess />}><OperationsBatches /></AuthenticatedWorkspace>;
}

function AgentOnboardingRoute() {
  return <Home startAgentOpen />;
}

function MarketplaceRoute() {
  return <Home />;
}

function SharedPropertyRoute() {
  const [, params] = useRoute("/property/:listingId");
  return <Home directListingId={params?.listingId} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MarketplaceRoute} />
      <Route path="/agent" component={AgentOnboardingRoute} />
      <Route path="/property/:listingId" component={SharedPropertyRoute} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/operations" component={OperationsRoute} />
      <Route path="/operations/batches" component={OperationsBatchesRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <ThemeToggle />
          <CommissionLedgerCsvExport />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
