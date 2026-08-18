import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./ApproximateMap.tsx", import.meta.url), "utf8");

describe("public landmark map privacy presentation", () => {
  it("uses the persisted radius only and tells users that the point is a 200–500m landmark area", () => {
    expect(source).toContain('radius={listing.map.radiusM}');
    expect(source).toContain('text(language, "mapPrivacyKey")');
    expect(source).toContain('text(language, "approximateLandmarkRadius")');
    expect(source).toContain('radius: listing.map.radiusM');
  });

  it("attaches a compact Total Move-In Cash label to each approximate pin without adding exact-location data", () => {
    expect(source).toContain("<Tooltip permanent");
    expect(source).toContain('className="map-cash-label"');
    expect(source).toContain("listing.costs.totalMoveInCashRequired");
    expect(source).not.toContain("exactAddress");
  });
});
