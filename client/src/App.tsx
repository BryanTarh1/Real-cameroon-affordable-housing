/**
 * Courtyard Atlas design reminder: keep the global shell quiet, editorial, and route-like.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessWorkspace } from "@/lib/workspaceAccess";
import NotFound from "@/pages/NotFound";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Route, Router as WouterRouter, Switch, useLocation, useRoute } from "wouter";
import React, { useCallback, useEffect, useState } from "react";
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
import AcceptanceWalkthrough from "./pages/AcceptanceWalkthrough";

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

function AcceptanceWalkthroughRoute() {
  return <AuthenticatedWorkspace allowedRoles={["admin"]} accessPanel={<AdminAccess />}><AcceptanceWalkthrough /></AuthenticatedWorkspace>;
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

/**
 * AHC’s public router uses URL fragments so a shared or refreshed public link
 * does not depend on a hosting-provider history fallback. Keeping this tiny
 * adapter local avoids the incompatible optional wouter hash-hook bundle that
 * can initialise against a different React dispatcher in the development
 * runtime.
 */
function currentHashPath() {
  if (typeof window === "undefined") return "/";
  const hash = window.location.hash.replace(/^#/, "");
  return hash.startsWith("/") ? hash : "/";
}

function useAhcHashLocation(): [string, (to: string) => void] {
  const [location, setLocation] = useState(currentHashPath);

  useEffect(() => {
    const onHashChange = () => setLocation(currentHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((to: string) => {
    const destination = to.startsWith("/") ? to : `/${to}`;
    if (currentHashPath() === destination) return;
    window.location.hash = destination;
  }, []);

  return [location, navigate];
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MarketplaceRoute} />
      <Route path="/homes" component={MarketplaceRoute} />
      <Route path="/agent" component={AgentOnboardingRoute} />
      <Route path="/property/:listingId" component={SharedPropertyRoute} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/operations" component={OperationsRoute} />
      <Route path="/operations/batches" component={OperationsBatchesRoute} />
      <Route path="/acceptance" component={AcceptanceWalkthroughRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** Keeps local-session termination visible across every authenticated AHC route. */
function SessionControl() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading || !user) return null;

  const signOut = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("Signed out of AHC", { description: "You can now sign in with a different test role." });
    } catch {
      toast.error("We could not complete the sign-out", { description: "Please refresh and try again." });
    }
  };

  return <div className="fixed right-3 top-3 z-[70] flex items-center gap-2 rounded-full border border-white/20 bg-[#132c34]/95 px-2 py-1.5 text-white shadow-lg backdrop-blur sm:right-16" aria-label="Active AHC session">
    <span className="hidden max-w-36 truncate px-1 text-xs font-medium sm:inline">{user.name || user.email}</span>
    <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#132c34] transition hover:bg-[#f7f3e9] focus:outline-none focus:ring-2 focus:ring-[#d78a1d] focus:ring-offset-2 focus:ring-offset-[#132c34]" onClick={signOut} aria-label="Sign out of Affordable Housing Cameroon">
      <LogOut size={14} aria-hidden="true" />
      <span>Sign out</span>
    </button>
  </div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <ThemeToggle />
          <CommissionLedgerCsvExport />
          <WouterRouter hook={useAhcHashLocation}>
            <SessionControl />
            <Router />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
