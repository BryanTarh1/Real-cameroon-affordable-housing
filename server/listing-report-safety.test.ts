import { describe, expect, it } from "vitest";
import { shouldEscalateListingSafetyReview, shouldSelectSecondVerifierAudit } from "./db";

describe("listing report priority review", () => {
  it("escalates to human review after three distinct inaccurate-cost reports", () => {
    expect(shouldEscalateListingSafetyReview("inaccurate_cost", 3)).toBe(true);
    expect(shouldEscalateListingSafetyReview("inaccurate_cost", 2)).toBe(false);
  });

  it("escalates to human review after three distinct unavailable-listing reports", () => {
    expect(shouldEscalateListingSafetyReview("unavailable", 3)).toBe(true);
    expect(shouldEscalateListingSafetyReview("unavailable", 2)).toBe(false);
  });

  it("does not elevate other categories solely by count", () => {
    expect(shouldEscalateListingSafetyReview("misleading_details", 10)).toBe(false);
    expect(shouldEscalateListingSafetyReview("unofficial_fee", 10)).toBe(false);
    expect(shouldEscalateListingSafetyReview("unsafe_meeting", 10)).toBe(false);
    expect(shouldEscalateListingSafetyReview("duplicate_listing", 10)).toBe(false);
    expect(shouldEscalateListingSafetyReview("other", 10)).toBe(false);
  });

  it("selects only the configured 20% independent-audit sample", () => {
    expect(shouldSelectSecondVerifierAudit(0)).toBe(true);
    expect(shouldSelectSecondVerifierAudit(0.1999)).toBe(true);
    expect(shouldSelectSecondVerifierAudit(0.2)).toBe(false);
    expect(shouldSelectSecondVerifierAudit(0.8)).toBe(false);
    expect(shouldSelectSecondVerifierAudit(Number.NaN)).toBe(false);
  });
});
