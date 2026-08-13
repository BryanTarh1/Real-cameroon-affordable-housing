import { describe, expect, it } from "vitest";
import { shouldApplyListingSafetyHold, shouldSelectSecondVerifierAudit } from "./db";

describe("listing report safety hold", () => {
  it("holds a listing after three distinct inaccurate-cost reports", () => {
    expect(shouldApplyListingSafetyHold("inaccurate_cost", 3)).toBe(true);
    expect(shouldApplyListingSafetyHold("inaccurate_cost", 2)).toBe(false);
  });

  it("holds a listing after three distinct unavailable-listing reports", () => {
    expect(shouldApplyListingSafetyHold("unavailable", 3)).toBe(true);
    expect(shouldApplyListingSafetyHold("unavailable", 2)).toBe(false);
  });

  it("does not auto-hold other report categories without staff review", () => {
    expect(shouldApplyListingSafetyHold("misleading_details", 10)).toBe(false);
    expect(shouldApplyListingSafetyHold("unofficial_fee", 10)).toBe(false);
    expect(shouldApplyListingSafetyHold("other", 10)).toBe(false);
  });

  it("selects only the configured 20% independent-audit sample", () => {
    expect(shouldSelectSecondVerifierAudit(0)).toBe(true);
    expect(shouldSelectSecondVerifierAudit(0.1999)).toBe(true);
    expect(shouldSelectSecondVerifierAudit(0.2)).toBe(false);
    expect(shouldSelectSecondVerifierAudit(0.8)).toBe(false);
    expect(shouldSelectSecondVerifierAudit(Number.NaN)).toBe(false);
  });
});
