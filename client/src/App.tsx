/**
 * Courtyard Atlas design reminder: keep the global shell quiet, editorial, and route-like.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessWorkspace, workspaceHomeForRole } from "@/lib/workspaceAccess";
import NotFound from "@/pages/NotFound";
import { LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Route, Router as WouterRouter, Switch, useLocation, useRoute } from "wouter";
import React, { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeToggle } from "./components/ThemeToggle";
import { CommissionLedgerCsvExport } from "./components/CommissionLedgerCsvExport";
import { ThemeProvider } from "./contexts/ThemeContext";
import { legacyHashPathToBrowserPath } from "./lib/legacyHashRoutes";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Operations from "./pages/Operations";
import OperationsBatches from "./pages/OperationsBatches";
import AcceptanceWalkthrough from "./pages/AcceptanceWalkthrough";
import AgentWorkspacePage from "./pages/AgentWorkspacePage";
import CustomerDashboard from "./pages/CustomerDashboard";

/**
 * Browser paths are only navigation destinations, never a permission grant. This guard waits
 * for the signed session, blocks the workspace tree for anonymous/wrong-role users,
 * then moves them to a route their current role may use. Server procedures retain
 * the authoritative permission checks for every data/action request.
 */
function ProtectedWorkspace({ allowedRoles, children }: { allowedRoles: readonly string[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const isAllowed = !user?.isBanned && canAccessWorkspace(user?.role, allowedRoles);

  useEffect(() => {
    if (loading || isAllowed) return;
    navigate(workspaceHomeForRole(user?.isBanned ? null : user?.role));
  }, [isAllowed, loading, navigate, user?.isBanned, user?.role]);

  if (loading || !isAllowed) {
    return <main className="operations-page" aria-busy="true" aria-live="polite"><div className="agent-drawer operations-access-panel"><span className="section-overline">AHC / Protected route</span><h1>{loading ? "Checking secure access…" : "Redirecting to your permitted workspace…"}</h1><p>Changing a hash link does not change your account role or unlock a protected AHC workspace.</p></div></main>;
  }

  return <>{children}</>;
}

function AdminRoute() {
  return <ProtectedWorkspace allowedRoles={["admin"]}><Admin /></ProtectedWorkspace>;
}

function OperationsRoute() {
  return <ProtectedWorkspace allowedRoles={["admin", "moderator"]}><Operations /></ProtectedWorkspace>;
}

function OperationsBatchesRoute() {
  return <ProtectedWorkspace allowedRoles={["admin", "moderator"]}><OperationsBatches /></ProtectedWorkspace>;
}

function AcceptanceWalkthroughRoute() {
  return <ProtectedWorkspace allowedRoles={["admin"]}><AcceptanceWalkthrough /></ProtectedWorkspace>;
}

function AgentOnboardingRoute() {
  return <ProtectedWorkspace allowedRoles={["user"]}><AgentWorkspacePage /></ProtectedWorkspace>;
}

function CustomerDashboardRoute() {
  return <ProtectedWorkspace allowedRoles={["user", "moderator", "admin"]}><CustomerDashboard /></ProtectedWorkspace>;
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
      <Route path="/homes" component={MarketplaceRoute} />
      <Route path="/agent" component={AgentOnboardingRoute} />
      <Route path="/dashboard" component={CustomerDashboardRoute} />
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

/** Keeps older in-app anchors usable while preventing them from writing a hash into the visible URL. */
function LegacyHashLinkBridge() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
      const href = link.getAttribute("href") ?? "";
      const route = legacyHashPathToBrowserPath(href);
      if (route) {
        link.dataset.legacyRoute = route;
        link.setAttribute("href", route);
        return;
      }
      const section = href.length > 1 ? document.getElementById(decodeURIComponent(href.slice(1))) : null;
      if (section) {
        link.dataset.scrollTarget = section.id;
        link.setAttribute("href", location);
      }
    });

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[data-legacy-route], a[data-scroll-target]");
      if (!link) return;

      const route = link.dataset.legacyRoute;
      if (route) {
        event.preventDefault();
        navigate(route);
        return;
      }

      const section = link.dataset.scrollTarget ? document.getElementById(link.dataset.scrollTarget) : null;
      if (!section) return;
      event.preventDefault();
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [location, navigate]);

  return null;
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
    <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#d78a1d]" onClick={() => navigate("/dashboard")} aria-label="Open my AHC dashboard">
      <LayoutDashboard size={14} aria-hidden="true" />
      <span className="hidden sm:inline">Dashboard</span>
    </button>
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
          <WouterRouter>
            <LegacyHashLinkBridge />
            <SessionControl />
            <Router />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
