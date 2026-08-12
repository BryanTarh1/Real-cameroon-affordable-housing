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
});
