import { describe, expect, it } from "vitest";
import { getMobileMoneyProviderLabel, isDuplicateProviderReferenceError, normalizeMobileMoneyReference } from "./paymentProvider";

describe("AHC dual Mobile Money payment-reference safeguards", () => {
  it("normalizes equivalent MTN MoMo and Orange Money transaction references before reconciliation", () => {
    expect(normalizeMobileMoneyReference(" mtn- ab 123 456 ")).toBe("MTNAB123456");
    expect(normalizeMobileMoneyReference("om-987 654")).toBe("OM987654");
  });

  it("rejects values that could be a wallet PIN, OTP, or malformed payment reference", () => {
    expect(() => normalizeMobileMoneyReference("1234")).toThrow("provider transaction reference");
    expect(() => normalizeMobileMoneyReference("MOMO@12345")).toThrow("provider transaction reference");
  });

  it("keeps clear provider labels while using server-side enum values", () => {
    expect(getMobileMoneyProviderLabel("mtn_momo")).toBe("MTN MoMo");
    expect(getMobileMoneyProviderLabel("orange_money")).toBe("Orange Money");
  });

  it("recognizes a database uniqueness conflict as a safe duplicate-reference outcome", () => {
    expect(isDuplicateProviderReferenceError({ code: "ER_DUP_ENTRY" })).toBe(true);
    expect(isDuplicateProviderReferenceError(new Error("Duplicate entry for key payment_orders_provider_reference_unique"))).toBe(true);
  });
});
