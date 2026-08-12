import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createListing: vi.fn(),
    getAgentPaidStatus: vi.fn(),
    getAgentProfile: vi.fn(),
    reconfirmAgentListing: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";

const user = {
  id: 73,
  openId: "paid-access-agent",
  email: "agent@example.com",
  name: "Paid Access Agent",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createAgentCaller() {
  const context: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(context);
}

const submission = {
  title: "One-bedroom near Carrefour Mvog-Mbi",
  city: "Yaoundé" as const,
  neighborhood: "Mvog-Mbi",
  landmark: "Near Carrefour Mvog-Mbi",
  propertyType: "One-bedroom",
  availableFrom: "2026-08-20",
  landmarkLatitude: 3.848,
  landmarkLongitude: 11.502,
  mapRadiusM: 300,
  costs: { monthlyRent: 60_000, advanceMonths: 2, securityDeposit: 0, agencyFee: 20_000, serviceFee: 0, firstMonthUtilities: 5_000 },
};

describe("AHC paid Agent Access API guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces an expired paid-access state through the agent status endpoint", async () => {
    vi.mocked(database.getAgentPaidStatus).mockResolvedValue({
      profile: { subscriptionStatus: "expired", subscriptionExpiresAt: new Date("2026-08-11T23:59:59.000Z") },
      availableCredits: 1,
      access: {
        active: false,
        daysRemaining: 0,
        renewalRecommended: false,
        shouldMarkExpired: false,
        suspensionReason: "Renew Agent Access before submitting new listings or reconfirming availability.",
      },
    } as never);

    await expect(createAgentCaller().agent.paidStatus()).resolves.toMatchObject({
      access: { active: false, daysRemaining: 0 },
      profile: { subscriptionStatus: "expired" },
    });
    expect(database.getAgentPaidStatus).toHaveBeenCalledWith(user.id);
  });

  it("rejects both submission and reconfirmation when the data guard reports expired access", async () => {
    vi.mocked(database.getAgentProfile).mockResolvedValue({ publicName: "Paid Access Agent" } as never);
    vi.mocked(database.createListing).mockRejectedValue(new Error("Renew Agent Access before submitting new listings or reconfirming availability."));
    vi.mocked(database.reconfirmAgentListing).mockRejectedValue(new Error("Renew Agent Access before submitting new listings or reconfirming availability."));
    const caller = createAgentCaller();

    await expect(caller.agent.submitListing(submission)).rejects.toThrow("Renew Agent Access");
    await expect(caller.agent.reconfirm({ listingId: "AHC-TEST-73" })).rejects.toThrow("Renew Agent Access");
    expect(database.createListing).toHaveBeenCalledWith(expect.objectContaining({ agentUserId: user.id }));
    expect(database.reconfirmAgentListing).toHaveBeenCalledWith(user.id, "AHC-TEST-73");
  });

  it("allows valid Agent Access to submit inventory and reconfirm published availability", async () => {
    vi.mocked(database.getAgentProfile).mockResolvedValue({ publicName: "Paid Access Agent" } as never);
    vi.mocked(database.createListing).mockResolvedValue("AHC-ACTIVE-73");
    vi.mocked(database.reconfirmAgentListing).mockResolvedValue({ success: true });
    const caller = createAgentCaller();

    await expect(caller.agent.submitListing(submission)).resolves.toEqual({ id: "AHC-ACTIVE-73", status: "under_review" });
    await expect(caller.agent.reconfirm({ listingId: "AHC-ACTIVE-73" })).resolves.toEqual({ success: true });
  });
});
