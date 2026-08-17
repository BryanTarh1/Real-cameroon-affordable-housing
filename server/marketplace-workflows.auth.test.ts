import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function ordinaryUserContext(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "ordinary-marketplace-user",
      email: "ordinary@example.com",
      name: "Ordinary Marketplace User",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AHC shortlist, viewing-slot, and route-planning boundaries", () => {
  it("requires sign-in before a seeker can read a saved shortlist", async () => {
    const caller = appRouter.createCaller(anonymousContext());

    await expect(caller.marketplace.shortlist.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("requires sign-in before a visitor can see available viewing slots", async () => {
    const caller = appRouter.createCaller(anonymousContext());

    await expect(caller.marketplace.appointments.availableSlots({ listingId: "AHC-TEST-01" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("requires sign-in before an Agent viewing-slot workspace can be opened", async () => {
    const caller = appRouter.createCaller(anonymousContext());

    await expect(caller.agent.viewingSlots.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps landmark-level verification batches restricted to Moderator operations", async () => {
    const caller = appRouter.createCaller(ordinaryUserContext());

    await expect(caller.operations.verificationBatches()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requires sign-in before a visitor can inspect price-change disclosures", async () => {
    const caller = appRouter.createCaller(anonymousContext());

    await expect(caller.marketplace.priceHistory({ listingId: "AHC-TEST-01" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("requires sign-in before a seeker can record a private post-viewing outcome", async () => {
    const caller = appRouter.createCaller(anonymousContext());

    await expect(caller.marketplace.appointments.recordSeekerOutcome({
      appointmentId: 1,
      outcome: "matched_listing",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires sign-in before an Agent quality dashboard can be accessed", async () => {
    const caller = appRouter.createCaller(anonymousContext());

    await expect(caller.agent.qualityDashboard()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps duplicate-review signals limited to Moderator operations", async () => {
    const caller = appRouter.createCaller(ordinaryUserContext());

    await expect(caller.operations.duplicateListingReviews()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
