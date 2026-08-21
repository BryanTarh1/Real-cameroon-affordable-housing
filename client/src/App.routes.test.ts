/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";

const auth = vi.hoisted(() => {
  const logout = vi.fn();
  return {
    logout,
    state: {
      user: null as null | { role: string; name?: string; email?: string },
      loading: false,
      isAuthenticated: false,
      logout,
    },
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => auth.state }));
vi.mock("./pages/Home", () => ({ default: () => "Public marketplace" }));
vi.mock("./pages/Admin", () => ({ default: () => "Admin management controls" }));
vi.mock("./pages/AdminAccess", () => ({ default: () => "Admin sign in" }));
vi.mock("./pages/Operations", () => ({ default: () => "Field Moderator operations" }));
vi.mock("./pages/OperationsBatches", () => ({ default: () => "Field Moderator route board" }));
vi.mock("./pages/AcceptanceWalkthrough", () => ({ default: () => "Owner acceptance walkthrough" }));
vi.mock("./pages/ModeratorAccess", () => ({ default: () => "Field Moderator sign in" }));
vi.mock("./pages/AgentWorkspacePage", () => ({ default: () => "Standalone Agent profile dashboard" }));
vi.mock("./pages/CustomerDashboard", () => ({ default: () => "Customer-owned dashboard" }));
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: unknown }) => children, useTheme: () => ({ theme: "light", toggleTheme: vi.fn(), switchable: true }) }));
vi.mock("./components/ErrorBoundary", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("./components/CommissionLedgerCsvExport", () => ({ CommissionLedgerCsvExport: () => null }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: unknown }) => children }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import App from "./App";

function renderAt(path: string, role: string | null) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  auth.state = {
    user: role ? { role, name: `Test ${role}`, email: `${role}@test.ahc.local` } : null,
    loading: false,
    isAuthenticated: Boolean(role),
    logout: auth.logout,
  };
  return render(createElement(App));
}

describe("protected workspace routes", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    auth.logout.mockResolvedValue(undefined);
  });

  it("shows a secure Admin sign-in boundary to anonymous visitors and redirects Seekers without rendering management controls", async () => {
    renderAt("/admin", null);
    expect(screen.getByText("Admin sign in")).toBeTruthy();
    expect(screen.queryByText("Admin management controls")).toBeNull();

    cleanup();
    renderAt("/admin", "seeker");
    await waitFor(() => expect(window.location.pathname).toBe("/account"));
    expect(screen.getByText("Customer-owned dashboard")).toBeTruthy();
    expect(screen.queryByText("Admin management controls")).toBeNull();
  });

  it("renders Admin controls only for an administrator", () => {
    renderAt("/admin", "admin");
    expect(screen.getByText("Admin management controls")).toBeTruthy();
    expect(screen.queryByText("Public marketplace")).toBeNull();
  });

  it("shows the local Agent sign-in boundary to anonymous visitors and allows only Agent accounts into the workspace", async () => {
    renderAt("/agent", null);
    expect(screen.getByText("Standalone Agent profile dashboard")).toBeTruthy();

    cleanup();
    renderAt("/agent", "agent");
    expect(screen.getByText("Standalone Agent profile dashboard")).toBeTruthy();
    expect(screen.queryByText("Public marketplace")).toBeNull();

    cleanup();
    renderAt("/agent", "moderator");
    await waitFor(() => expect(window.location.pathname).toBe("/operations"));
    expect(screen.getByText("Field Moderator operations")).toBeTruthy();
  });

  it("keeps the owner acceptance walkthrough behind the Admin role and redirects every other browser-path attempt", async () => {
    renderAt("/acceptance", null);
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(screen.getByText("Public marketplace")).toBeTruthy();
    expect(screen.queryByText("Owner acceptance walkthrough")).toBeNull();

    cleanup();
    renderAt("/acceptance", "seeker");
    await waitFor(() => expect(window.location.pathname).toBe("/account"));
    expect(screen.getByText("Customer-owned dashboard")).toBeTruthy();
    expect(screen.queryByText("Owner acceptance walkthrough")).toBeNull();

    cleanup();
    renderAt("/acceptance", "admin");
    expect(screen.getByText("Owner acceptance walkthrough")).toBeTruthy();
  });

  it("shows the secure Field Moderator sign-in boundary to anonymous visitors while allowing only staff into operations", async () => {
    renderAt("/operations", null);
    expect(screen.getByText("Field Moderator sign in")).toBeTruthy();
    expect(screen.queryByText("Field Moderator operations")).toBeNull();

    cleanup();
    renderAt("/operations", "seeker");
    await waitFor(() => expect(window.location.pathname).toBe("/account"));
    expect(screen.getByText("Customer-owned dashboard")).toBeTruthy();
    expect(screen.queryByText("Field Moderator operations")).toBeNull();

    cleanup();
    renderAt("/operations", "moderator");
    expect(screen.getByText("Field Moderator operations")).toBeTruthy();

    cleanup();
    renderAt("/operations", "admin");
    expect(screen.getByText("Field Moderator operations")).toBeTruthy();
  });

  it("shows the secure Field Moderator sign-in boundary on the geographic route board while allowing staff access", async () => {
    renderAt("/operations/batches", null);
    expect(screen.getByText("Field Moderator sign in")).toBeTruthy();
    expect(screen.queryByText("Field Moderator route board")).toBeNull();

    cleanup();
    renderAt("/operations/batches", "seeker");
    await waitFor(() => expect(window.location.pathname).toBe("/account"));
    expect(screen.getByText("Customer-owned dashboard")).toBeTruthy();
    expect(screen.queryByText("Field Moderator route board")).toBeNull();

    cleanup();
    renderAt("/operations/batches", "moderator");
    expect(screen.getByText("Field Moderator route board")).toBeTruthy();

    cleanup();
    renderAt("/operations/batches", "admin");
    expect(screen.getByText("Field Moderator route board")).toBeTruthy();
  });

  it("protects the customer dashboard from anonymous browser-path edits while keeping each signed-in account scoped to its own data", async () => {
    renderAt("/dashboard", null);
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(screen.getByText("Public marketplace")).toBeTruthy();
    expect(screen.queryByText("Customer-owned dashboard")).toBeNull();

    cleanup();
    renderAt("/dashboard", "seeker");
    expect(screen.getByText("Customer-owned dashboard")).toBeTruthy();
  });

  it("shows sign out only for an explicit AHC session and returns to the public browser route", async () => {
    renderAt("/", null);
    expect(screen.queryByRole("button", { name: "Sign out of Affordable Housing Cameroon" })).toBeNull();

    cleanup();
    renderAt("/admin", "admin");
    fireEvent.click(screen.getByRole("button", { name: "Sign out of Affordable Housing Cameroon" }));
    await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1));
    expect(window.location.pathname).toBe("/");
  });

  it("closes a platform-opened seeker property window after sign-out instead of returning through another browser route", async () => {
    const closeWindow = vi.spyOn(window, "close").mockImplementation(() => undefined);
    renderAt("/property/test-listing?ahc-window=seeker", "seeker");

    fireEvent.click(screen.getByRole("button", { name: "Sign out of Affordable Housing Cameroon" }));

    await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1));
    expect(closeWindow).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/property/test-listing");
    expect(window.sessionStorage.getItem("ahc-dedicated-seeker-window")).toBe("1");
    closeWindow.mockRestore();
  });

  it("closes a platform-opened seeker property window when browser Back is invoked instead of exposing duplicate marketplace content", async () => {
    const closeWindow = vi.spyOn(window, "close").mockImplementation(() => undefined);
    renderAt("/property/test-listing?ahc-window=seeker", "seeker");

    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => expect(closeWindow).toHaveBeenCalledTimes(1));
    expect(window.location.pathname).toBe("/property/test-listing");
    expect(window.sessionStorage.getItem("ahc-dedicated-seeker-window")).toBe("1");
    closeWindow.mockRestore();
  });
});
