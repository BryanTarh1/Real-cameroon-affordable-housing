import { describe, expect, it } from "vitest";
import { publicWalkthroughForDetail } from "./publicWalkthrough";

describe("publicWalkthroughForDetail", () => {
  it("keeps an approved public Walk-Thru available to the listing detail", () => {
    const walkthrough = { url: "https://media.example.test/home.mp4", durationSeconds: 22, verifiedAt: "2026-08-13T00:00:00.000Z" };
    expect(publicWalkthroughForDetail(walkthrough)).toEqual(walkthrough);
  });

  it("does not manufacture a player for missing or malformed public media", () => {
    expect(publicWalkthroughForDetail(null)).toBeNull();
    expect(publicWalkthroughForDetail({ url: "", durationSeconds: 22, verifiedAt: null })).toBeNull();
    expect(publicWalkthroughForDetail({ url: "https://media.example.test/home.mp4", durationSeconds: 0, verifiedAt: null })).toBeNull();
  });
});
