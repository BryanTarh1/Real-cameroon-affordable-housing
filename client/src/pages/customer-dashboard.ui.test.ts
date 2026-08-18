import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/CustomerDashboard.tsx"), "utf8");
const agentPortal = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/PaidAgentPortal.tsx"), "utf8");

describe("customer dashboard and payment feedback", () => {
  it("keeps dashboard data and receipts scoped to the authenticated account", () => {
    expect(dashboard).toContain("trpc.account.dashboard.useQuery");
    expect(dashboard).toContain("trpc.account.officialServiceReceipt.useQuery");
    expect(dashboard).toContain("only AHC platform-service orders that belong to you");
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

  it("shows account-private favourites, history, avatar controls, and stored-only notification preferences", () => {
    expect(dashboard).toContain("trpc.account.browsingHistory.useQuery");
    expect(dashboard).toContain("Saved homes");
    expect(dashboard).toContain("Recent browsing");
    expect(dashboard).toContain("/api/customer/profile-picture");
    expect(dashboard).toContain("JPG or PNG only, maximum 2 MB");
    expect(dashboard).toContain("AHC does not send email alerts until a delivery provider is configured");
  });

  it("lets a customer clear their picture back to the blank default avatar", () => {
    expect(dashboard).toContain("trpc.account.removeProfileImage.useMutation");
    expect(dashboard).toContain("Remove picture");
    expect(dashboard).toContain("Blank profile picture");
    expect(dashboard).toContain("blank default avatar");
  });

  it("consolidates saved-search alerts and private viewing requests without implying unconfigured delivery", () => {
    expect(dashboard).toContain("Saved searches and viewing requests");
    expect(dashboard).toContain("<SeekerMatchAlerts isAuthenticated={Boolean(user)} language=\"en\" />");
    expect(dashboard).toContain("<SeekerAppointmentHistory isAuthenticated={Boolean(user)} language=\"en\" />");
    expect(dashboard).toContain("will not imply live email or WhatsApp delivery until a provider is configured");
  });

  it("labels the checkout simulator as no-charge testing and covers pending, success, and retry feedback", () => {
    expect(dashboard).toContain("TEST ONLY");
    expect(dashboard).toContain("never contacts a payment provider, charges a payment method, or creates an AHC order");
    expect(dashboard).toContain("Simulating a protected checkout response…");
    expect(dashboard).toContain("Retry successful path");
    expect(dashboard).toContain("No payment, order, receipt, or account balance changed.");
  });
});
