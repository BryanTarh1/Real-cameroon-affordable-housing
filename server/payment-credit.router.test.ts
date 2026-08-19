import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createListing: vi.fn(),
    createPaymentOrder: vi.fn(),
    getAdminOfficialServiceReceipt: vi.fn(),
    getAgentProfile: vi.fn(),
    getAgentOfficialServiceReceipt: vi.fn(),
    reconcilePaymentOrder: vi.fn(),
    submitPaymentReference: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";

const agent = { id: 62, openId: "payment-agent", email: "agent@example.com", name: "Payment Agent", loginMethod: "manus", role: "agent" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const moderator = { id: 63, openId: "payment-moderator", email: "moderator@example.com", name: "Payment Moderator", loginMethod: "manus", role: "moderator" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin = { id: 64, openId: "payment-admin", email: "admin@example.com", name: "Payment Admin", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function callerFor(user: typeof agent | typeof moderator | typeof admin) {
  return appRouter.createCaller({ user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

const submission = {
  title: "Studio near Rond Point Nlongkak", city: "Yaoundé" as const, neighborhood: "Nlongkak", landmark: "Near Rond Point Nlongkak", propertyType: "Studio", furnishingStatus: "unfurnished" as const, availableFrom: "2026-08-21", landmarkLatitude: 3.871, landmarkLongitude: 11.515, mapRadiusM: 300,
  costs: { monthlyRent: 55_000, advanceMonths: 2, securityDeposit: 0, agencyFee: 10_000, serviceFee: 0, firstMonthUtilities: 5_000 },
};

describe("AHC payment reconciliation and listing-credit API guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the first-month Welcome Bundle in the agent-owned reference-submission flow", async () => {
    vi.mocked(database.createPaymentOrder).mockResolvedValue({ id: "PAY-WELCOME-62", status: "awaiting_reference" } as never);
    vi.mocked(database.submitPaymentReference).mockResolvedValue({ success: true });
    const caller = callerFor(agent);

    await expect(caller.agent.createPaymentOrder({ type: "welcome_bundle" })).resolves.toMatchObject({ id: "PAY-WELCOME-62", status: "awaiting_reference" });
    await expect(caller.agent.submitPaymentReference({ orderId: "PAY-WELCOME-62", provider: "mtn_momo", reference: "MOMO-TEST-981" })).resolves.toEqual({ success: true });

    expect(database.createPaymentOrder).toHaveBeenCalledWith(agent.id, "welcome_bundle", undefined);
    expect(database.submitPaymentReference).toHaveBeenCalledWith(agent.id, "PAY-WELCOME-62", "mtn_momo", "MOMO-TEST-981");
  });

  it("exposes only MTN MoMo and Orange Money for new platform-service references", async () => {
    vi.mocked(database.submitPaymentReference).mockResolvedValue({ success: true });
    const caller = callerFor(agent);

    await expect(caller.agent.submitPaymentReference({ orderId: "PAY-ORANGE-62", provider: "orange_money", reference: "ORANGE-998812" })).resolves.toEqual({ success: true });
    await expect(caller.agent.submitPaymentReference({ orderId: "PAY-OTHER-62", provider: "other" as never, reference: "OTHER-998812" })).rejects.toThrow();
    expect(database.submitPaymentReference).toHaveBeenCalledWith(agent.id, "PAY-ORANGE-62", "orange_money", "ORANGE-998812");
  });

  it("exposes only the approved recurring plans and verification variants to the Agent route", async () => {
    vi.mocked(database.createPaymentOrder).mockResolvedValue({ id: "PAY-PLAN-62", status: "awaiting_reference" } as never);
    const caller = callerFor(agent);

    await expect(caller.agent.createPaymentOrder({ type: "starter_access" })).resolves.toMatchObject({ id: "PAY-PLAN-62" });
    await expect(caller.agent.createPaymentOrder({ type: "pro_access" })).resolves.toMatchObject({ id: "PAY-PLAN-62" });
    await expect(caller.agent.requestPhysicalVerification({ listingId: "LIST-62", serviceType: "route_batch" })).resolves.toMatchObject({ id: "PAY-PLAN-62" });

    expect(database.createPaymentOrder).toHaveBeenCalledWith(agent.id, "starter_access", undefined);
    expect(database.createPaymentOrder).toHaveBeenCalledWith(agent.id, "pro_access", undefined);
    expect(database.createPaymentOrder).toHaveBeenCalledWith(agent.id, "physical_verification_route_batch", "LIST-62");
  });

  it("rejects arbitrary tenancy-money order types so the platform cannot become an escrow or rent-collection flow", async () => {
    const caller = callerFor(agent);

    await expect(caller.agent.createPaymentOrder({ type: "tenant_deposit" as never })).rejects.toThrow();
    expect(database.createPaymentOrder).not.toHaveBeenCalled();
  });

  it("accepts reconciliation only through the Admin governance namespace and removes it from Field Moderator operations", async () => {
    vi.mocked(database.reconcilePaymentOrder).mockResolvedValue({ status: "confirmed" } as never);

    expect(Object.keys(appRouter._def.record.operations)).not.toContain("paymentQueue");
    expect(Object.keys(appRouter._def.record.operations)).not.toContain("reconcilePayment");

    await expect(callerFor(admin).admin.reconcilePayment({
      orderId: "PAY-ACCESS-62",
      decision: "confirmed",
      note: "MTN reference matched the received merchant evidence.",
    })).resolves.toEqual({ status: "confirmed" });

    expect(database.reconcilePaymentOrder).toHaveBeenCalledWith(64, "PAY-ACCESS-62", "confirmed", "MTN reference matched the received merchant evidence.");
  });

  it("exposes printable official receipts only after confirmation, to the paying agent or an Admin", async () => {
    const receipt = { orderId: "PAY-ACCESS-62", officialReceiptCode: "AHC-2026-ACCESS62", amountXaf: 3_000, serviceType: "agent_access" };
    vi.mocked(database.getAgentOfficialServiceReceipt).mockResolvedValue(receipt as never);
    vi.mocked(database.getAdminOfficialServiceReceipt).mockResolvedValue(receipt as never);

    await expect(callerFor(agent).agent.officialServiceReceipt({ orderId: "PAY-ACCESS-62" })).resolves.toEqual(receipt);
    await expect(callerFor(admin).admin.officialServiceReceipt({ orderId: "PAY-ACCESS-62" })).resolves.toEqual(receipt);
    await expect(callerFor(moderator).admin.officialServiceReceipt({ orderId: "PAY-ACCESS-62" })).rejects.toThrow();

    expect(database.getAgentOfficialServiceReceipt).toHaveBeenCalledWith(agent.id, "PAY-ACCESS-62");
    expect(database.getAdminOfficialServiceReceipt).toHaveBeenCalledWith("PAY-ACCESS-62");
  });

  it("does not allow a listing to enter review when the data guard reports no available commercial credit", async () => {
    vi.mocked(database.getAgentProfile).mockResolvedValue({ publicName: "Payment Agent" } as never);
    vi.mocked(database.createListing).mockRejectedValue(new Error("Your Welcome Bundle or Starter Access includes five listing credits. Reconcile a qualifying plan before submitting a new listing."));

    await expect(callerFor(agent).agent.submitListing(submission)).rejects.toThrow("Welcome Bundle or Starter Access");
    expect(database.createListing).toHaveBeenCalledWith(expect.objectContaining({ agentUserId: agent.id, title: submission.title }));
  });
});
