import { describe, expect, it } from "vitest";
import { buildSanitizedLocalTestingSnapshot, isAuthorizedLocalTestingExport } from "./localTestingSnapshot";

const TOKEN = "local-testing-token-that-is-at-least-thirty-two-characters";
const configuredExportToken = process.env.AHC_LOCAL_TEST_EXPORT_TOKEN;

describe("local testing snapshot safeguards", () => {
  it("requires a correctly formed matching bearer token", () => {
    expect(isAuthorizedLocalTestingExport(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
    expect(isAuthorizedLocalTestingExport("Bearer wrong-token", TOKEN)).toBe(false);
    expect(isAuthorizedLocalTestingExport(`Bearer ${TOKEN}`, "")).toBe(false);
    expect(isAuthorizedLocalTestingExport(undefined, TOKEN)).toBe(false);
  });

  it("exports only a deliberately sanitised marketplace shape", () => {
    const snapshot = buildSanitizedLocalTestingSnapshot([{
      id: "lst-01", title: "Test home", city: "Yaoundé", neighborhood: "Jouvence", landmark: "Near the junction",
      propertyType: "Apartment", bedrooms: 2, householdFit: "Couple", availableFrom: "2026-08-14", lastReconfirmed: "2026-08-14T08:00:00.000Z",
      map: { latitude: 3.86, longitude: 11.5, radiusM: 300 }, featured: false, verificationStatus: "physical_verified", photosCount: 4,
      walkthrough: { url: "https://private.example/video" }, neighborhoodEssentials: { roadAccess: "tarred" }, trust: { guaranteedTotalCash: true },
      costs: { monthlyRent: 80_000, advanceMonths: 2, securityDeposit: 20_000, agencyFee: 10_000, serviceFee: 0, firstMonthUtilities: 5_000, totalMoveInCashRequired: 195_000 },
    }]);

    expect(snapshot.classification).toBe("sanitized-local-testing-only");
    expect(snapshot.listings[0]).toMatchObject({ id: "lst-01", hasPublishedWalkthrough: true, approximateMap: { radiusM: 300 } });
    expect(snapshot.listings[0]).not.toHaveProperty("agent");
    expect(snapshot.listings[0]).not.toHaveProperty("walkthrough");
    expect(JSON.stringify(snapshot)).not.toContain("private.example");
  });

  it.skipIf(!configuredExportToken)("accepts the configured token at the lightweight local snapshot endpoint", async () => {
    const response = await fetch("http://127.0.0.1:3000/api/local-testing/snapshot", {
      headers: { Authorization: `Bearer ${configuredExportToken}` },
    });

    // The endpoint checks the bearer token before applying its intentional
    // one-minute cooldown, so a 429 still proves this configured token passed.
    expect([200, 429]).toContain(response.status);
    const body = await response.json();
    if (response.status === 200) expect(body.classification).toBe("sanitized-local-testing-only");
    else expect(body.error).toMatch(/one minute/i);
  });
});
