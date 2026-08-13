import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAgentContext(): TrpcContext {
  return {
    user: {
      id: 47,
      openId: "ordinary-agent",
      email: "agent@example.com",
      name: "Ordinary Agent",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AHC moderator operations authorization", () => {
  it("prevents an ordinary agent from reading the listing review queue", async () => {
    const caller = appRouter.createCaller(createAgentContext());

    await expect(caller.operations.reviewQueue()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("prevents an ordinary agent from approving a listing", async () => {
    const caller = appRouter.createCaller(createAgentContext());

    await expect(
      caller.operations.decideReview({
        listingId: "AHC-TEST-01",
        decision: "approved",
        reason: "Costs, landmark scope, and available date were checked.",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("prevents an ordinary agent from reading private field-verification proof", async () => {
    const caller = appRouter.createCaller(createAgentContext());

    await expect(caller.operations.verificationEvidenceHistory()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("prevents an ordinary user from reading private trust reports and WhatsApp lead events", async () => {
    const caller = appRouter.createCaller(createAgentContext());

    await expect(caller.admin.trustReports()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.leadEvents()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an authenticated seeker to request the tracked contact route rather than a raw WhatsApp URL", async () => {
    const caller = appRouter.createCaller(createAgentContext());

    await expect(caller.marketplace.getContact({ listingId: "AHC-TEST-01" })).resolves.toEqual({
      redirectUrl: "/api/listings/AHC-TEST-01/whatsapp",
    });
  });
});

describe("AHC seeker trust-report authorization", () => {
  it("requires a signed-in AHC account before a listing can be reported", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.marketplace.report({
      listingId: "AHC-TEST-01",
      reason: "inaccurate_cost",
      note: "The requested move-in cash was materially higher than the declared total.",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
