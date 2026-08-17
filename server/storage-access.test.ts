import { describe, expect, it } from "vitest";
import { canReadPrivateStorageKey, canReadWalkthroughStorageKey } from "./storageAccess";

const seeker = { id: 12, role: "user" as const, isBanned: false };
const moderator = { id: 18, role: "moderator" as const, isBanned: false };
const admin = { id: 3, role: "admin" as const, isBanned: false };

describe("private storage access policy", () => {
  it("fails closed for anonymous visitors, cross-account avatars, and unknown private prefixes", () => {
    expect(canReadPrivateStorageKey("private/customer-avatar/12/avatar.jpg", null)).toBe(false);
    expect(canReadPrivateStorageKey("private/customer-avatar/22/avatar.jpg", seeker)).toBe(false);
    expect(canReadPrivateStorageKey("private/internal/unknown.jpg", admin)).toBe(false);
  });

  it("permits only the customer who owns an avatar and allows Admin review of agent identity files", () => {
    expect(canReadPrivateStorageKey("private/customer-avatar/12/avatar.jpg", seeker)).toBe(true);
    expect(canReadPrivateStorageKey("private/customer-avatar/12/avatar.jpg", admin)).toBe(false);
    expect(canReadPrivateStorageKey("private/agent-identity/12/front.jpg", seeker)).toBe(true);
    expect(canReadPrivateStorageKey("private/agent-identity/12/front.jpg", admin)).toBe(true);
  });

  it("releases walkthrough media publicly only when both the clip and listing are published", () => {
    expect(canReadWalkthroughStorageKey({ capturedByUserId: 18, videoStatus: "published", listingStatus: "published" }, null)).toBe(true);
    expect(canReadWalkthroughStorageKey({ capturedByUserId: 18, videoStatus: "captured", listingStatus: "published" }, null)).toBe(false);
    expect(canReadWalkthroughStorageKey({ capturedByUserId: 18, videoStatus: "published", listingStatus: "suspended" }, seeker)).toBe(false);
  });

  it("keeps unpublished walkthrough evidence visible only to its moderator or an Admin", () => {
    const withheld = { capturedByUserId: 18, videoStatus: "withheld" as const, listingStatus: "draft" };
    expect(canReadWalkthroughStorageKey(withheld, moderator)).toBe(true);
    expect(canReadWalkthroughStorageKey(withheld, admin)).toBe(true);
    expect(canReadWalkthroughStorageKey(withheld, seeker)).toBe(false);
  });
});
