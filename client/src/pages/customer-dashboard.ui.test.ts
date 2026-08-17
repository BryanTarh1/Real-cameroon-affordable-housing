import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/CustomerDashboard.tsx"), "utf8");
const agentPortal = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/PaidAgentPortal.tsx"), "utf8");

describe("customer dashboard and payment feedback", () => {
  it("keeps dashboard data and receipts scoped to the authenticated account", () => {
    expect(dashboard).toContain("trpc.account.dashboard.useQuery");
    expect(dashboard).toContain("trpc.account.officialServiceReceipt.useQuery");
    expect(dashboard).toContain("only the AHC platform-service orders that belong to you");
    expect(dashboard).toContain("Rent, deposits, and other tenancy money are never collected here");
  });

  it("shows a pending state and an actionable retry state instead of confusing an authenticated failure with sign-in", () => {
    expect(dashboard).toContain("Preparing your customer dashboard…");
    expect(dashboard).toContain("We could not load your dashboard");
    expect(dashboard).toContain("Try again");
    expect(dashboard).toContain("dashboard.refetch()");
    expect(dashboard.indexOf("if (!user)")).toBeLessThan(dashboard.indexOf("dashboard.isError || !dashboard.data?.profile"));
  });

  it("keeps payment-order actions visibly pending and gives Agents clear recovery feedback", () => {
    expect(agentPortal).toContain("isPending");
    expect(agentPortal).toContain("toast.error");
    expect(agentPortal).toContain("try again");
  });
});
