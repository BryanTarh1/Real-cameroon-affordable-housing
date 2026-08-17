import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import {
  APPROXIMATE_RADIUS_MAX_M,
  APPROXIMATE_RADIUS_MIN_M,
  calculateFieldVerificationCommission,
  calculateTotalMoveInCash,
  createApproximatePoint,
  normalizeCameroonWhatsAppPhone,
} from "../shared/ahc";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function nextSeed(seed: number) {
  return (seed * 1_664_525 + 1_013_904_223) >>> 0;
}

describe("AHC deterministic stability scenarios", () => {
  it("preserves financial, commission, phone, and landmark privacy invariants across 25,000 generated scenarios", () => {
    let seed = 0x0a11c;

    for (let index = 0; index < 10_000; index += 1) {
      seed = nextSeed(seed);
      const monthlyRent = seed % 500_001;
      seed = nextSeed(seed);
      const advanceMonths = seed % 25;
      seed = nextSeed(seed);
      const securityDeposit = seed % 500_001;
      seed = nextSeed(seed);
      const agencyFee = seed % 250_001;
      seed = nextSeed(seed);
      const serviceFee = seed % 250_001;
      seed = nextSeed(seed);
      const firstMonthUtilities = seed % 100_001;

      expect(calculateTotalMoveInCash({ monthlyRent, advanceMonths, securityDeposit, agencyFee, serviceFee, firstMonthUtilities }))
        .toBe(monthlyRent * advanceMonths + securityDeposit + agencyFee + serviceFee + firstMonthUtilities);
    }

    for (let index = 0; index < 5_000; index += 1) {
      seed = nextSeed(seed);
      const grossAmountXaf = seed % 1_000_001;
      seed = nextSeed(seed);
      const shareBps = seed % 10_001;
      const split = calculateFieldVerificationCommission(grossAmountXaf, shareBps);

      expect(split.fieldModeratorAmountXaf + split.platformAmountXaf).toBe(grossAmountXaf);
      expect(split.fieldModeratorAmountXaf).toBe(Math.floor((grossAmountXaf * shareBps) / 10_000));
    }

    for (let index = 0; index < 5_000; index += 1) {
      seed = nextSeed(seed);
      const localNumber = `6${String(seed % 100_000_000).padStart(8, "0")}`;
      expect(normalizeCameroonWhatsAppPhone(`+237 ${localNumber}`)).toBe(`237${localNumber}`);
    }

    for (let index = 0; index < 5_000; index += 1) {
      seed = nextSeed(seed);
      const firstRandom = seed / 0x1_0000_0000;
      seed = nextSeed(seed);
      const secondRandom = seed / 0x1_0000_0000;
      const originalLatitude = 3.848 + (index % 19) / 10_000;
      const originalLongitude = 11.502 + (index % 23) / 10_000;
      const point = createApproximatePoint(originalLatitude, originalLongitude, 100 + (index % 700), (() => {
        const values = [firstRandom, secondRandom];
        return () => values.shift() ?? 0.5;
      })());

      expect(point.radiusM).toBeGreaterThanOrEqual(APPROXIMATE_RADIUS_MIN_M);
      expect(point.radiusM).toBeLessThanOrEqual(APPROXIMATE_RADIUS_MAX_M);
      expect([point.latitude, point.longitude]).not.toEqual([originalLatitude, originalLongitude]);
    }
  });

  it("rejects 2,000 concurrent protected-workflow attempts before any customer record can be read or mutated", async () => {
    const calls = Array.from({ length: 500 }, () => {
      const caller = appRouter.createCaller(anonymousContext());
      return [
        caller.marketplace.shortlist.list(),
        caller.marketplace.appointments.availableSlots({ listingId: "AHC-STRESS-TEST" }),
        caller.agent.viewingSlots.list(),
        caller.operations.duplicateListingReviews(),
      ];
    }).flat();

    const outcomes = await Promise.allSettled(calls);
    expect(outcomes).toHaveLength(2_000);
    for (const outcome of outcomes) {
      expect(outcome.status).toBe("rejected");
      if (outcome.status === "rejected") {
        expect(outcome.reason).toMatchObject({ code: expect.stringMatching(/UNAUTHORIZED|FORBIDDEN/) });
      }
    }
  });
});
