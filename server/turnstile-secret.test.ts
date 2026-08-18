import { describe, expect, it } from "vitest";

describe("configured Cloudflare Turnstile secret", () => {
  it("is accepted by the verification endpoint without disclosing the secret", async () => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    expect(secret).toBeTruthy();

    const body = new URLSearchParams({ secret: secret!, response: "missing-test-token" });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    expect(response.ok).toBe(true);
    const result = await response.json() as { success?: boolean; "error-codes"?: string[] };
    expect(result.success).toBe(false);
    expect(result["error-codes"]).toContain("invalid-input-response");
    expect(result["error-codes"]).not.toContain("invalid-input-secret");
  }, 15_000);
});
