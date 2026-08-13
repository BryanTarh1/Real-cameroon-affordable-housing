import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createLocalAgentAccount: vi.fn(),
    createOwnerOnboardingApplication: vi.fn(),
    getOwnerOnboardingApplication: vi.fn(),
    getAgentProfile: vi.fn(),
    upsertAgentProfile: vi.fn(),
    createListing: vi.fn(),
    listOwnerOnboardingApplications: vi.fn(),
    reviewOwnerOnboardingApplication: vi.fn(),
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

function protectedCaller(role: "user" | "admin" = "user") {
  return appRouter.createCaller({
    user: { ...testUser, role },
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

  it("lets a signed-in supplier submit a complete Direct Owner evidence package for protected review", async () => {
    vi.mocked(database.createOwnerOnboardingApplication).mockResolvedValue({ id: 73, status: "submitted" } as never);
    const api = protectedCaller();
    await expect(api.agent.applyAsOwner({
      governmentIdUrl: "https://example.com/government-id.png",
      landTitleUrl: "https://example.com/land-title.png",
      occupancyRightUrl: "https://example.com/occupancy-right.png",
      supportingDocumentUrl: "https://example.com/property-support.png",
    })).resolves.toMatchObject({ status: "submitted" });
    expect(database.createOwnerOnboardingApplication).toHaveBeenCalledWith({
      userId: testUser.id,
      governmentIdUrl: "https://example.com/government-id.png",
      landTitleUrl: "https://example.com/land-title.png",
      occupancyRightUrl: "https://example.com/occupancy-right.png",
      supportingDocumentUrl: "https://example.com/property-support.png",
    });
  });

  it("returns explicit empty workspace values instead of crashing a signed-in user without an Agent or Owner record", async () => {
    const api = protectedCaller();

    await expect(api.agent.profile()).resolves.toBeNull();
    await expect(api.agent.ownerApplication()).resolves.toBeNull();
  });

  it("prevents a pending Direct Owner declaration from reopening the lighter Agent profile path", async () => {
    vi.mocked(database.getOwnerOnboardingApplication).mockResolvedValue({ status: "submitted" } as never);
    const api = protectedCaller();
    await expect(api.agent.setupProfile({ publicName: "Pending Owner", whatsappPhone: "+237690000000" }))
      .rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(database.upsertAgentProfile).not.toHaveBeenCalled();
  });

  it("keeps Owner evidence review inside the Admin boundary", async () => {
    const userApi = protectedCaller();
    await expect(userApi.admin.ownerApplications()).rejects.toMatchObject({ code: "FORBIDDEN" });

    vi.mocked(database.reviewOwnerOnboardingApplication).mockResolvedValue({ id: 73, status: "approved" } as never);
    const adminApi = protectedCaller("admin");
    await expect(adminApi.admin.reviewOwnerApplication({ applicationId: 73, decision: "approved", reviewNote: "Identity, property right, title, and supporting evidence were reviewed together." }))
      .resolves.toMatchObject({ status: "approved" });
    expect(database.reviewOwnerOnboardingApplication).toHaveBeenCalledWith({
      adminUserId: testUser.id,
      applicationId: 73,
      decision: "approved",
      reviewNote: "Identity, property right, title, and supporting evidence were reviewed together.",
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
