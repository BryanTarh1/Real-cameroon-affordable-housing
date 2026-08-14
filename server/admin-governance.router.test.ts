import type { TrpcContext } from "./_core/context";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAdminCashFlowAudit: vi.fn(),
    listAdminCommissionLedger: vi.fn(),
    getPlatformSettings: vi.fn(),
    listAdminUsers: vi.fn(),
    listFieldModeratorCommissions: vi.fn(),
    setUserBan: vi.fn(),
    updatePlatformSettings: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";

const stamp = { createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin = { id: 81, openId: "admin-81", email: "admin@example.com", name: "AHC Admin", loginMethod: "manus", role: "admin" as const, isBanned: false, ...stamp };
const moderator = { id: 82, openId: "field-82", email: "field@example.com", name: "Field Moderator", loginMethod: "manus", role: "moderator" as const, isBanned: false, ...stamp };
const bannedUser = { id: 83, openId: "banned-83", email: "banned@example.com", name: "Suspended Agent", loginMethod: "manus", role: "user" as const, isBanned: true, ...stamp };

function callerFor(user: typeof admin | typeof moderator | typeof bannedUser) {
  return appRouter.createCaller({ user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("AHC Admin governance and Field Moderator boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a Field Moderator from changing platform commercial settings", async () => {
    await expect(callerFor(moderator).admin.settings()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(database.getPlatformSettings).not.toHaveBeenCalled();
  });

  it("records an Admin price and commission-split update through the protected API", async () => {
    const nextSettings = { agentAccessFeeXaf: 3_000, starterAccessFeeXaf: 10_000, proAccessFeeXaf: 25_000, featuredPinFeeXaf: 2_500, routeBatchVerificationFeeXaf: 5_000, physicalVerificationFeeXaf: 7_500, fieldModeratorShareBps: 8_000, ownerAlertsEnabled: true };
    vi.mocked(database.updatePlatformSettings).mockResolvedValue({ id: 1, ...nextSettings, updatedAt: new Date(), updatedByUserId: admin.id } as never);
    await expect(callerFor(admin).admin.updateSettings(nextSettings)).resolves.toMatchObject({ proAccessFeeXaf: 25_000, fieldModeratorShareBps: 8_000 });
    expect(database.updatePlatformSettings).toHaveBeenCalledWith(admin.id, nextSettings);
  });

  it("enforces user suspension before any protected agent endpoint is reached", async () => {
    await expect(callerFor(bannedUser).agent.paidStatus()).rejects.toThrow("suspended");
  });

  it("returns only the signed-in Field Moderator’s earned verification allocations", async () => {
    vi.mocked(database.listFieldModeratorCommissions).mockResolvedValue([{ id: 1, moderatorUserId: moderator.id, verificationOrderId: 44, listingId: "AHC-44", grossAmountXaf: 7_500, fieldModeratorAmountXaf: 6_000, platformAmountXaf: 1_500, fieldModeratorShareBps: 8_000, status: "accrued", createdAt: new Date() }] as never);
    await expect(callerFor(moderator).operations.myVerificationCommissions()).resolves.toMatchObject([{ moderatorUserId: moderator.id, verificationOrderId: 44, fieldModeratorAmountXaf: 6_000 }]);
    expect(database.listFieldModeratorCommissions).toHaveBeenCalledWith(moderator.id);
  });

  it("keeps the full cross-moderator commission ledger exclusive to Admin", async () => {
    vi.mocked(database.listAdminCommissionLedger).mockResolvedValue([{ id: 2, verificationOrderId: 45, listingId: "AHC-45", moderatorUserId: moderator.id, moderatorName: moderator.name, grossAmountXaf: 7_500, fieldModeratorAmountXaf: 6_000, platformAmountXaf: 1_500, fieldModeratorShareBps: 8_000, status: "accrued", createdAt: new Date() }] as never);
    await expect(callerFor(admin).admin.commissionLedger()).resolves.toMatchObject([{ verificationOrderId: 45, moderatorName: "Field Moderator", platformAmountXaf: 1_500 }]);
    await expect(callerFor(moderator).admin.commissionLedger()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(database.listAdminCommissionLedger).toHaveBeenCalledTimes(1);
  });

  it("returns confirmed revenue and recorded verification allocations only to Admin", async () => {
    vi.mocked(database.getAdminCashFlowAudit).mockResolvedValue({
      confirmedRevenueXaf: 18_500,
      physicalVerificationRevenueXaf: 7_500,
      fieldModeratorCommissionAccruedXaf: 6_000,
      platformCommissionAccruedXaf: 1_500,
    } as never);
    await expect(callerFor(admin).admin.cashFlowAudit()).resolves.toMatchObject({
      confirmedRevenueXaf: 18_500,
      fieldModeratorCommissionAccruedXaf: 6_000,
      platformCommissionAccruedXaf: 1_500,
    });
    await expect(callerFor(moderator).admin.cashFlowAudit()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(database.getAdminCashFlowAudit).toHaveBeenCalledTimes(1);
  });
});
