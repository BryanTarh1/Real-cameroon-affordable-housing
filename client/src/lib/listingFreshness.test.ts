import { describe, expect, it } from "vitest";
import { daysUntilRefresh, formatReconfirmedDate, LISTING_FRESHNESS_WINDOW_DAYS } from "./listingFreshness";

describe("Agent listing freshness", () => {
  const reconfirmedAt = new Date("2026-08-01T12:00:00.000Z");

  it("uses the shared 14-day window and rounds partial days up for a clear Agent countdown", () => {
    expect(LISTING_FRESHNESS_WINDOW_DAYS).toBe(14);
    expect(daysUntilRefresh(reconfirmedAt, new Date("2026-08-05T13:00:00.000Z").getTime())).toBe(10);
  });

  it("never shows a negative number after the reconfirmation deadline", () => {
    expect(daysUntilRefresh(reconfirmedAt, new Date("2026-08-20T12:00:00.000Z").getTime())).toBe(0);
  });

  it("formats the recorded reconfirmation date for read-only workspace display", () => {
    expect(formatReconfirmedDate(reconfirmedAt)).toMatch(/1 Aug 2026/);
  });
});
