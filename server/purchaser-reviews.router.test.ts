import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listApprovedAgentReviews: vi.fn(),
    listConfirmedPurchasesForSeeker: vi.fn(),
    createAgentReview: vi.fn(),
    confirmPurchaseFromViewing: vi.fn(),
    moderateAgentReview: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";

const user = (id: number, role: "seeker" | "agent" | "admin") => ({
  id,
  openId: `review-${role}-${id}`,
  email: `${role}-${id}@example.com`,
  name: `AHC ${role}`,
  loginMethod: "manus" as const,
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

const callerFor = (id: number, role: "seeker" | "agent" | "admin") => appRouter.createCaller({
  user: user(id, role),
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("verified purchaser reviews", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows a seeker to see only their unreviewed Administrator-confirmed outcome eligibility", async () => {
    vi.mocked(database.listConfirmedPurchasesForSeeker).mockResolvedValue([
      { confirmedPurchaseId: 51, agentUserId: 7, listingTitle: "Biyem-Assi two-bedroom", canSubmit: true },
      { confirmedPurchaseId: 52, agentUserId: 8, listingTitle: "Bonamoussadi apartment", canSubmit: false },
    ] as never);

    await expect(callerFor(19, "seeker").marketplace.agentReviews.canReview({ agentUserId: 7 })).resolves.toEqual({
      canReview: true,
      eligiblePurchases: [{ confirmedPurchaseId: 51, agentUserId: 7, listingTitle: "Biyem-Assi two-bedroom", canSubmit: true }],
    });
    expect(database.listConfirmedPurchasesForSeeker).toHaveBeenCalledWith(19);
  });

  it("rejects Agent accounts before they can inspect eligibility or submit a purchaser review", async () => {
    const agentCaller = callerFor(7, "agent");
    await expect(agentCaller.marketplace.agentReviews.canReview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(agentCaller.marketplace.agentReviews.submit({
      confirmedPurchaseId: 51,
      reviewText: "The Agent was clear and respectful throughout the completed home arrangement.",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(database.listConfirmedPurchasesForSeeker).not.toHaveBeenCalled();
    expect(database.createAgentReview).not.toHaveBeenCalled();
  });

  it("passes a valid seeker review only through the confirmed-purchase identifier", async () => {
    vi.mocked(database.createAgentReview).mockResolvedValue({ id: 91, moderationStatus: "pending" } as never);
    await expect(callerFor(19, "seeker").marketplace.agentReviews.submit({
      confirmedPurchaseId: 51,
      reviewText: "The Agent was clear and respectful throughout the completed home arrangement.",
    })).resolves.toEqual({ id: 91, moderationStatus: "pending" });
    expect(database.createAgentReview).toHaveBeenCalledWith({
      seekerUserId: 19,
      confirmedPurchaseId: 51,
      reviewText: "The Agent was clear and respectful throughout the completed home arrangement.",
    });
  });

  it("requires an Administrator to derive eligibility from a completed appointment and to moderate publication", async () => {
    vi.mocked(database.confirmPurchaseFromViewing).mockResolvedValue({ id: 51 } as never);
    vi.mocked(database.moderateAgentReview).mockResolvedValue({ status: "approved" } as never);
    const adminCaller = callerFor(1, "admin");

    await adminCaller.admin.confirmPurchase({ appointmentId: 42, note: "Independent follow-up confirmed the completed arrangement." });
    await adminCaller.admin.moderateAgentReview({ reviewId: 91, decision: "approved", note: "Factual and suitable for anonymous publication." });

    expect(database.confirmPurchaseFromViewing).toHaveBeenCalledWith({ adminUserId: 1, appointmentId: 42, note: "Independent follow-up confirmed the completed arrangement." });
    expect(database.moderateAgentReview).toHaveBeenCalledWith({ adminUserId: 1, reviewId: 91, decision: "approved", note: "Factual and suitable for anonymous publication." });
  });

  it("keeps public review output anonymous and makes one review per confirmed outcome a database invariant", () => {
    const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(dbSource).toMatch(/listApprovedAgentReviews[\s\S]*?id: agentReviews\.id,[\s\S]*?reviewText: agentReviews\.reviewText,[\s\S]*?createdAt: agentReviews\.createdAt,[\s\S]*?\}\)\.from\(agentReviews\)[\s\S]*?moderationStatus, "approved"/);
    expect(dbSource).not.toMatch(/listApprovedAgentReviews[\s\S]{0,600}reviewerUserId/);
    expect(schemaSource).toMatch(/confirmedPurchaseId: int\("confirmedPurchaseId"\)\.notNull\(\)\.unique\(\)/);
  });
});
