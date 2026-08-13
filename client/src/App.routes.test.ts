/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";

const auth = vi.hoisted(() => ({
  state: { user: null as null | { role: string }, loading: false, isAuthenticated: false },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => auth.state }));
vi.mock("./pages/Home", () => ({ default: () => "Public marketplace" }));
vi.mock("./pages/Admin", () => ({ default: () => "Admin management controls" }));
vi.mock("./pages/AdminAccess", () => ({ default: () => "Admin sign in" }));
vi.mock("./pages/Operations", () => ({ default: () => "Field Moderator operations" }));
vi.mock("./pages/OperationsBatches", () => ({ default: () => "Field Moderator route board" }));
vi.mock("./pages/ModeratorAccess", () => ({ default: () => "Field Moderator sign in" }));
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: unknown }) => children, useTheme: () => ({ theme: "light", toggleTheme: vi.fn(), switchable: true }) }));
vi.mock("./components/ErrorBoundary", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("./components/CommissionLedgerCsvExport", () => ({ CommissionLedgerCsvExport: () => null }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: unknown }) => children }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

import App from "./App";

function renderAt(path: string, role: string | null) {
  window.history.pushState({}, "", path);
  auth.state = {
    user: role ? { role } : null,
    loading: false,
    isAuthenticated: Boolean(role),
  };
  return render(createElement(App));
}

describe("protected workspace routes", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

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
});
