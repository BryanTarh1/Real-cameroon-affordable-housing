import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("Resend owner-alert configuration", () => {
  it("authenticates with Resend and confirms the configured sender domain is verified", async () => {
    expect(ENV.resendApiKey).toBeTruthy();
    expect(ENV.ownerAlertEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(ENV.resendFromEmail).toMatch(/^(?:[^<]*<)?[^\s@]+@[^\s@]+>?(?:>)?$/);

    const senderAddress = ENV.resendFromEmail.match(/<([^>]+)>/)?.[1] ?? ENV.resendFromEmail;
    const senderDomain = senderAddress.split("@")[1]?.trim().toLowerCase();
    expect(senderDomain).toBeTruthy();
    const usesResendOnboardingSender = senderAddress.trim().toLowerCase() === "onboarding@resend.dev";

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${ENV.resendApiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null) as { data?: Array<{ name?: string; status?: string }> } | null;

    expect(response.ok).toBe(true);
    expect(
      usesResendOnboardingSender || body?.data?.some(domain => domain.name?.toLowerCase() === senderDomain && domain.status === "verified"),
    ).toBe(true);
  }, 15_000);
});
