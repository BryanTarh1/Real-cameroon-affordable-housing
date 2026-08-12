import { describe, expect, it } from "vitest";
import {
  calculateTotalMoveInCash,
  createApproximatePoint,
  createWhatsAppListingLink,
  isListingFresh,
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
});
