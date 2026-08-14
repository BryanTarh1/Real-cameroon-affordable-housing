import { describe, expect, it } from "vitest";
import {
  AHC_PAID_OFFERS,
  calculateFieldVerificationCommission,
  calculateTotalMoveInCash,
  createApproximatePoint,
  createWhatsAppListingLink,
  getAgentAccessState,
  getPaidOffer,
  isListingFresh,
  normalizeCameroonWhatsAppPhone,
  PRO_ACTIVE_LISTING_LIMIT,
} from "./ahc";

describe("AHC affordability and trust rules", () => {
  it("calculates the complete total move-in cash requirement", () => {
    expect(calculateTotalMoveInCash({
      monthlyRent: 50_000,
      advanceMonths: 3,
      securityDeposit: 50_000,
      agencyFee: 25_000,
      serviceFee: 5_000,
      firstMonthUtilities: 10_000,
    })).toBe(240_000);
  });

  it("uses a strict fourteen-day freshness window", () => {
    expect(isListingFresh("2026-08-01T00:00:00.000Z", new Date("2026-08-15T00:00:00.000Z"))).toBe(true);
    expect(isListingFresh("2026-08-01T00:00:00.000Z", new Date("2026-08-16T00:00:01.000Z"))).toBe(false);
  });

  it("builds an encoded WhatsApp listing link", () => {
    expect(createWhatsAppListingLink("+237 6 99 88 77 66", "AHC-2026-01"))
      .toBe("https://wa.me/237699887766?text=Hi%2C%20I%20found%20Listing%20AHC-2026-01%20on%20AHC");
  });

  it("never returns the submitted map reference coordinate", () => {
    const point = createApproximatePoint(3.848, 11.502, 300, () => 0.5);
    expect(point.radiusM).toBe(300);
    expect([point.latitude, point.longitude]).not.toEqual([3.848, 11.502]);
  });

  it("maps approved Welcome and recurring plans to their declared entitlement contract", () => {
    expect(getPaidOffer("welcome_bundle")).toEqual(AHC_PAID_OFFERS.welcomeBundle);
    expect(getPaidOffer("welcome_bundle")).toMatchObject({ amountXaf: 3_000, validityDays: 30, listingCredits: 5, priorityRanking: false });
    expect(getPaidOffer("starter_access")).toMatchObject({ amountXaf: 10_000, listingCredits: 5, priorityRanking: false });
    expect(getPaidOffer("pro_access")).toMatchObject({ amountXaf: 25_000, priorityRanking: true, activeListingLimit: 20 });
    expect(PRO_ACTIVE_LISTING_LIMIT).toBe(20);
  });

  it("preserves the approved short promotion and two verification service prices", () => {
    expect(getPaidOffer("featured_pin")).toMatchObject({ amountXaf: 2_500, validityDays: 7 });
    expect(getPaidOffer("physical_verification_route_batch").amountXaf).toBe(5_000);
    expect(getPaidOffer("physical_verification_individual").amountXaf).toBe(7_500);
  });

  it("requires unexpired Agent Access before an agent can submit or reconfirm inventory", () => {
    const now = new Date("2026-08-12T00:00:00.000Z");
    const renewingSoon = getAgentAccessState("active", "2026-08-18T00:00:00.000Z", now);
    const expired = getAgentAccessState("active", "2026-08-11T23:59:59.000Z", now);

    expect(renewingSoon).toMatchObject({ active: true, daysRemaining: 6, renewalRecommended: true });
    expect(expired).toMatchObject({ active: false, shouldMarkExpired: true });
    expect(expired.suspensionReason).toContain("reconfirming availability");
  });

  it("normalizes a Cameroon mobile number before a commercial contact flow", () => {
    expect(normalizeCameroonWhatsAppPhone("+237 6 99 88 77 66")).toBe("237699887766");
    expect(() => normalizeCameroonWhatsAppPhone("+237 1 23 45 67 89")).toThrow("valid Cameroon mobile number");
  });

  it("keeps all declared fees inside the total move-in cash metric", () => {
    const withoutFees = calculateTotalMoveInCash({ monthlyRent: 60_000, advanceMonths: 2, securityDeposit: 0, agencyFee: 0, serviceFee: 0, firstMonthUtilities: 0 });
    const withFees = calculateTotalMoveInCash({ monthlyRent: 60_000, advanceMonths: 2, securityDeposit: 60_000, agencyFee: 20_000, serviceFee: 5_000, firstMonthUtilities: 15_000 });
    expect(withFees).toBeGreaterThan(withoutFees);
    expect(withFees).toBe(220_000);
  });

  it("allocates a durable 80/20 field-verification commission split without losing the XAF remainder", () => {
    expect(calculateFieldVerificationCommission(5_000)).toEqual({ grossAmountXaf: 5_000, fieldModeratorShareBps: 8_000, fieldModeratorAmountXaf: 4_000, platformAmountXaf: 1_000 });
    expect(calculateFieldVerificationCommission(7_500)).toEqual({ grossAmountXaf: 7_500, fieldModeratorShareBps: 8_000, fieldModeratorAmountXaf: 6_000, platformAmountXaf: 1_500 });
    expect(calculateFieldVerificationCommission(101, 8_000)).toEqual({ grossAmountXaf: 101, fieldModeratorShareBps: 8_000, fieldModeratorAmountXaf: 80, platformAmountXaf: 21 });
  });
});
