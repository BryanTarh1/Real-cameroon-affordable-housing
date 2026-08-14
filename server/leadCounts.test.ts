import { describe, expect, it } from "vitest";
import { summarizeAdminLeadEvents } from "./leadCounts";

describe("summarizeAdminLeadEvents", () => {
  it("returns one privacy-limited row per listing with an increasing WhatsApp click count", () => {
    const summary = summarizeAdminLeadEvents([
      { id: 1, listingId: "home-1", seekerUserId: 5, contactUserId: 2, channel: "whatsapp", createdAt: new Date("2026-08-14T09:00:00Z"), listingTitle: "Quiet Odza two-bedroom", city: "Yaoundé", neighborhood: "Odza" },
      { id: 2, listingId: "home-2", seekerUserId: 7, contactUserId: 3, channel: "whatsapp", createdAt: new Date("2026-08-14T10:00:00Z"), listingTitle: "Akwa studio", city: "Douala", neighborhood: "Akwa" },
      { id: 3, listingId: "home-1", seekerUserId: 5, contactUserId: 2, channel: "whatsapp", createdAt: new Date("2026-08-14T11:00:00Z"), listingTitle: "Quiet Odza two-bedroom", city: "Yaoundé", neighborhood: "Odza" },
      { id: 4, listingId: "home-1", seekerUserId: 8, contactUserId: 2, channel: "whatsapp", createdAt: new Date("2026-08-14T12:00:00Z"), listingTitle: "Quiet Odza two-bedroom", city: "Yaoundé", neighborhood: "Odza" },
    ]);

    expect(summary).toHaveLength(2);
    expect(summary[0]).toMatchObject({ listingId: "home-1", clickCount: 3, uniqueSeekerCount: 2 });
    expect(summary[0].firstClickedAt.toISOString()).toBe("2026-08-14T09:00:00.000Z");
    expect(summary[0].lastClickedAt.toISOString()).toBe("2026-08-14T12:00:00.000Z");
    expect(summary[1]).toMatchObject({ listingId: "home-2", clickCount: 1, uniqueSeekerCount: 1 });
  });
});
