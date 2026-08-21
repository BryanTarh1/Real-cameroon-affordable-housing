import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./Home.visual-refinement.css", import.meta.url), "utf8");

describe("public verified purchaser reviews", () => {
  it("loads only the public approved-review projection and states that reviews do not rate trust", () => {
    expect(home).toContain("trpc.marketplace.agentReviews.list.useQuery");
    expect(home).toContain("VERIFIED PURCHASER REVIEWS");
    expect(home).toContain("Their identities remain private.");
    expect(home).toContain("These reviews are not a rating and do not change the Agent’s operational trust score.");
    expect(home).toContain("No verified purchaser review has been published for this Agent yet.");
  });

  it("keeps the review panel readable on the premium light and dark property-detail surfaces", () => {
    expect(styles).toContain(".verified-purchaser-reviews");
    expect(styles).toContain(".dark .ahc-app .verified-purchaser-reviews");
  });
});
