import { describe, expect, it } from "vitest";
import { getModeratorCommissionStatusCopy } from "./operationsCommission";

describe("Field Moderator commission-status messaging", () => {
  it("makes held allocations explicitly dependent on evidence, audit, and Admin payout approval", () => {
    expect(getModeratorCommissionStatusCopy("held")).toContain("Admin payout approval");
    expect(getModeratorCommissionStatusCopy("held")).toContain("independent audit");
  });

  it("does not describe accrued allocations as automatically paid", () => {
    expect(getModeratorCommissionStatusCopy("accrued")).toContain("approved operating process");
    expect(getModeratorCommissionStatusCopy("paid")).toContain("payout date");
    expect(getModeratorCommissionStatusCopy("voided")).toContain("no longer eligible");
  });
});
