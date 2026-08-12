import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, decideListingReview: vi.fn(), listReviewHistory: vi.fn() };
});

import * as database from "./db";
import { appRouter } from "./routers";

const moderator = {
  id: 81,
  openId: "operations-moderator",
  email: "moderator@example.com",
  name: "AHC Moderator",
  loginMethod: "manus",
  role: "moderator" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createModeratorCaller() {
  const context: TrpcContext = { user: moderator, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(context);
}

describe("AHC moderator review decisions and audit history", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a moderator decision through the protected API boundary", async () => {
    vi.mocked(database.decideListingReview).mockResolvedValue({ status: "published" } as never);

    await expect(createModeratorCaller().operations.decideReview({
      listingId: "AHC-REVIEW-81",
      decision: "approved",
      reason: "Costs, landmark privacy, and stated availability were reviewed.",
    })).resolves.toEqual({ status: "published" });

    expect(database.decideListingReview).toHaveBeenCalledWith(81, "AHC-REVIEW-81", "approved", "Costs, landmark privacy, and stated availability were reviewed.");
  });

  it("returns the immutable review-event history only to an authorized moderator", async () => {
    const events = [{ id: 9, listingId: "AHC-REVIEW-81", action: "approved", fromStatus: "under_review", toStatus: "published", reason: "Costs verified.", actorUserId: 81, assignedModeratorUserId: 81, createdAt: new Date("2026-08-12T08:00:00.000Z") }];
    vi.mocked(database.listReviewHistory).mockResolvedValue(events as never);

    await expect(createModeratorCaller().operations.reviewHistory({ listingId: "AHC-REVIEW-81" })).resolves.toEqual(events);
    expect(database.listReviewHistory).toHaveBeenCalledWith("AHC-REVIEW-81");
  });
});
