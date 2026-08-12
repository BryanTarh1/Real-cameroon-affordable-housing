import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createLocalAgentAccount: vi.fn(),
  };
});

vi.mock("./_core/localAuth", async importOriginal => {
  const actual = await importOriginal<typeof import("./_core/localAuth")>();
  return {
    ...actual,
    hashLocalPassword: vi.fn().mockResolvedValue("scrypt$trust-workflow$hash"),
    createLocalSessionToken: vi.fn().mockResolvedValue("ahc-local-trust-token"),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const testUser = {
  id: 412,
  openId: "local_trust_workflow",
  email: "owner@example.com",
  name: "Owner Applicant",
  loginMethod: "ahc_local",
  role: "user" as const,
  isBanned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function publicCaller() {
  return appRouter.createCaller({
    user: null,
    req: { protocol: "https", headers: {} },
    res: { cookie: vi.fn() },
  } as unknown as TrpcContext);
}

describe("AHC trust-workflow validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an Agent applicant to provide government ID and proof of work", async () => {
    const api = publicCaller();

    await expect(api.auth.registerLocalAgent({
      name: "Agent Applicant",
      email: "agent-proof-missing@example.com",
      password: "Strong-password-2026",
      onboarding: {
        applicantType: "agent",
        governmentIdUrl: "https://example.com/government-id.png",
      },
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(database.createLocalAgentAccount).not.toHaveBeenCalled();
  });

  it("requires an Owner applicant to provide the full property-rights document package", async () => {
    const api = publicCaller();

    await expect(api.auth.registerLocalAgent({
      name: "Owner Applicant",
      email: "owner-proof-missing@example.com",
      password: "Strong-password-2026",
      onboarding: {
        applicantType: "owner",
        governmentIdUrl: "https://example.com/government-id.png",
        landTitleUrl: "https://example.com/land-title.png",
      },
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(database.createLocalAgentAccount).not.toHaveBeenCalled();
  });

  it("passes a complete Owner application to persistence without accepting a self-assigned staff role", async () => {
    vi.mocked(database.createLocalAgentAccount).mockResolvedValue(testUser as never);
    const api = publicCaller();

    await expect(api.auth.registerLocalAgent({
      name: "Owner Applicant",
      email: "OWNER@EXAMPLE.COM",
      password: "Strong-password-2026",
      onboarding: {
        applicantType: "owner",
        governmentIdUrl: "https://example.com/government-id.png",
        landTitleUrl: "https://example.com/land-title.png",
        occupancyRightUrl: "https://example.com/occupancy-right.png",
        supportingDocumentUrl: "https://example.com/property-support.png",
      },
      role: "admin",
    } as never)).resolves.toMatchObject({ id: testUser.id, role: "user" });

    expect(database.createLocalAgentAccount).toHaveBeenCalledWith({
      name: "Owner Applicant",
      email: "owner@example.com",
      passwordHash: "scrypt$trust-workflow$hash",
      onboarding: {
        applicantType: "owner",
        governmentIdUrl: "https://example.com/government-id.png",
        landTitleUrl: "https://example.com/land-title.png",
        occupancyRightUrl: "https://example.com/occupancy-right.png",
        supportingDocumentUrl: "https://example.com/property-support.png",
      },
    });
  });

  it("requires at least two proof images, including an exterior comparison image", () => {
    const evidence = [
      {
        kind: "interior" as const,
        mediaUrl: "https://example.com/interior.png",
        listingMatch: "matches" as const,
        observation: "Living-room layout and finish match the submitted listing photographs.",
      },
      {
        kind: "bathroom" as const,
        mediaUrl: "https://example.com/bathroom.png",
        listingMatch: "matches" as const,
        observation: "Bathroom fixtures and water point match the submitted listing details.",
      },
    ];

    expect(() => database.validateFieldVerificationEvidence(evidence)).toThrow(/at least two proof images, including an exterior/i);
    expect(() => database.validateFieldVerificationEvidence([{ ...evidence[0], kind: "exterior" }])).toThrow(/at least two proof images/i);
    expect(() => database.validateFieldVerificationEvidence([{ ...evidence[0], kind: "exterior" }, evidence[1]])).not.toThrow();
  });
});
