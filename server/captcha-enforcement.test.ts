import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createListingReport: vi.fn(),
    createLocalAgentAccount: vi.fn(),
    getLocalCredentialByEmail: vi.fn(),
  };
});

import * as database from "./db";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const seeker = {
  id: 711,
  openId: "local_711",
  email: "seeker@example.com",
  name: "Seeker",
  loginMethod: "ahc_local",
  role: "user" as const,
  isBanned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function caller(user: typeof seeker | null = null) {
  return appRouter.createCaller({
    user,
    req: { protocol: "https", headers: {}, socket: { remoteAddress: "203.0.113.10" } },
    res: { cookie: vi.fn() },
  } as unknown as TrpcContext);
}

describe("AHC server-side Turnstile enforcement", () => {
  const originalTurnstileSecretKey = ENV.turnstileSecretKey;

  beforeEach(() => {
    vi.clearAllMocks();
    ENV.turnstileSecretKey = "test-turnstile-secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
  });

  afterAll(() => {
    ENV.turnstileSecretKey = originalTurnstileSecretKey;
    vi.unstubAllGlobals();
  });

  it("blocks registration before account creation when a CAPTCHA token is omitted", async () => {
    await expect(caller().auth.registerLocalAgent({ name: "New Agent", email: "new@example.com", password: "Strong-password-2026" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(database.createLocalAgentAccount).not.toHaveBeenCalled();
  });

  it("blocks password sign-in before account lookup when a CAPTCHA token is omitted", async () => {
    await expect(caller().auth.loginLocalAgent({ email: "agent@example.com", password: "Strong-password-2026" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(database.getLocalCredentialByEmail).not.toHaveBeenCalled();
  });

  it("blocks an authenticated safety report when a CAPTCHA token is omitted", async () => {
    await expect(caller(seeker).marketplace.report({
      listingId: "AHC-TEST-01",
      reason: "inaccurate_cost",
      note: "The requested amount was materially above the declared move-in cash.",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(database.createListingReport).not.toHaveBeenCalled();
  });

  it("rejects a provider-denied token before a password can be verified", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) }));
    vi.mocked(database.getLocalCredentialByEmail).mockResolvedValue(null as never);

    await expect(caller().auth.loginLocalAgent({ email: "agent@example.com", password: "Strong-password-2026", captchaToken: "failed-token" })).rejects.toMatchObject({ code: "FORBIDDEN", message: "Security verification failed. Please complete the challenge and try again." });
  });

  it("fails closed when Turnstile is not configured", async () => {
    ENV.turnstileSecretKey = "";

    await expect(caller().auth.registerLocalAgent({ name: "New Agent", email: "new@example.com", password: "Strong-password-2026", captchaToken: "unverified-token" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(database.createLocalAgentAccount).not.toHaveBeenCalled();
  });

  it("verifies a valid report token server-side before creating the report", async () => {
    vi.mocked(database.createListingReport).mockResolvedValue({ id: 16, priorityReviewRequired: false } as never);

    await expect(caller(seeker).marketplace.report({
      listingId: "AHC-TEST-01",
      reason: "inaccurate_cost",
      note: "The requested amount was materially above the declared move-in cash.",
      captchaToken: "valid-token",
    })).resolves.toMatchObject({ id: 16 });
    expect(fetch).toHaveBeenCalledOnce();
    expect(database.createListingReport).toHaveBeenCalledWith(seeker.id, "AHC-TEST-01", "inaccurate_cost", "The requested amount was materially above the declared move-in cash.", expect.any(String));
  });
});
