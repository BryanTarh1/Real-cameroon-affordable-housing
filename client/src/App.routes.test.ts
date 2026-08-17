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
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: unknown }) => children, useTheme: () => ({ theme: "light", toggleTheme: vi.fn(), switchable: true }) }));
vi.mock("./components/ErrorBoundary", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("./components/CommissionLedgerCsvExport", () => ({ CommissionLedgerCsvExport: () => null }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: unknown }) => children }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import App from "./App";

function renderAt(path: string, role: string | null) {
  window.location.hash = `#${path}`;
  window.dispatchEvent(new HashChangeEvent("hashchange"));
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
    auth.logout.mockResolvedValue(undefined);
  });

  it("shows an Admin sign-in boundary for anonymous and ordinary users without rendering management controls", async () => {
    renderAt("/admin", null);
    await waitFor(() => expect(screen.getByText("Admin sign in")).toBeTruthy());
    expect(screen.queryByText("Admin management controls")).toBeNull();

    cleanup();
    renderAt("/admin", "user");
    await waitFor(() => expect(screen.getByText("Admin sign in")).toBeTruthy());
    expect(screen.queryByText("Admin management controls")).toBeNull();
  });

  it("renders Admin controls only for an administrator", () => {
    renderAt("/admin", "admin");
    expect(screen.getByText("Admin management controls")).toBeTruthy();
    expect(screen.queryByText("Public marketplace")).toBeNull();
  });

  it("opens the Agent workspace as a standalone route rather than the public marketplace", () => {
    renderAt("/agent", null);
    expect(screen.getByText("Standalone Agent profile dashboard")).toBeTruthy();
    expect(screen.queryByText("Public marketplace")).toBeNull();
  });

  it("keeps the owner acceptance walkthrough behind the explicit Admin session boundary", async () => {
    renderAt("/acceptance", null);
    await waitFor(() => expect(screen.getByText("Admin sign in")).toBeTruthy());
    expect(screen.queryByText("Owner acceptance walkthrough")).toBeNull();

    cleanup();
    renderAt("/acceptance", "user");
    await waitFor(() => expect(screen.getByText("Admin sign in")).toBeTruthy());
    expect(screen.queryByText("Owner acceptance walkthrough")).toBeNull();

    cleanup();
    renderAt("/acceptance", "admin");
    expect(screen.getByText("Owner acceptance walkthrough")).toBeTruthy();
  });

  it("shows a Field Moderator sign-in entry for non-staff while allowing moderators and administrators", async () => {
    renderAt("/operations", null);
    expect(screen.getByText("Field Moderator sign in")).toBeTruthy();
    expect(screen.queryByText("Field Moderator operations")).toBeNull();

    cleanup();
    renderAt("/operations", "user");
    expect(screen.getByText("Field Moderator sign in")).toBeTruthy();
    expect(screen.queryByText("Field Moderator operations")).toBeNull();

    cleanup();
    renderAt("/operations", "moderator");
    expect(screen.getByText("Field Moderator operations")).toBeTruthy();

    cleanup();
    renderAt("/operations", "admin");
    expect(screen.getByText("Field Moderator operations")).toBeTruthy();
  });

  it("restricts the geographic route board to Field Moderators and administrators", async () => {
    renderAt("/operations/batches", null);
    await waitFor(() => expect(screen.getByText("Field Moderator sign in")).toBeTruthy());
    expect(screen.queryByText("Field Moderator route board")).toBeNull();

    cleanup();
    renderAt("/operations/batches", "user");
    await waitFor(() => expect(screen.getByText("Field Moderator sign in")).toBeTruthy());
    expect(screen.queryByText("Field Moderator route board")).toBeNull();

    cleanup();
    renderAt("/operations/batches", "moderator");
    expect(screen.getByText("Field Moderator route board")).toBeTruthy();

    cleanup();
    renderAt("/operations/batches", "admin");
    expect(screen.getByText("Field Moderator route board")).toBeTruthy();
  });

  it("shows sign out only for an explicit AHC session and returns to the public hash route", async () => {
    renderAt("/", null);
    expect(screen.queryByRole("button", { name: "Sign out of Affordable Housing Cameroon" })).toBeNull();

    cleanup();
    renderAt("/admin", "admin");
    fireEvent.click(screen.getByRole("button", { name: "Sign out of Affordable Housing Cameroon" }));
    await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1));
    expect(window.location.hash).toBe("#/");
  });
});
