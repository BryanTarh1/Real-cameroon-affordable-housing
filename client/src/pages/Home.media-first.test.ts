import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./launch-refinements.css", import.meta.url), "utf8");

describe("public media-first listing cards", () => {
  it("autoplays a muted walkthrough and keeps the Total Move-In Cash over the media", () => {
    expect(homeSource).toContain("muted autoPlay loop playsInline");
    expect(homeSource).toContain("media-move-in-cash");
    expect(homeSource).toContain('text(language, "totalCash")');
    expect(homeSource).toContain("onClick={onOpen}");
  });

  it("gives the primary media surface a large responsive canvas and visible keyboard focus", () => {
    expect(styles).toContain("min-height:270px");
    expect(styles).toContain(".listing-media-preview:focus-visible");
    expect(styles).toContain("@media(max-width:720px)");
  });

  it("does not manufacture a video for a physically verified listing that lacks a published walkthrough", () => {
    expect(homeSource).toContain('text(language, "walkthroughPending")');
    expect(homeSource).toContain('text(language, "walkthroughPendingBody")');
    expect(homeSource).toContain('listing.verificationStatus === "physical_verified"');
  });

  it("renders only the curated public-media projection as photo evidence", () => {
    expect(homeSource).toContain("listing.publicMedia[0]");
    expect(homeSource).toContain("listing.publicMedia.map(media");
    expect(homeSource).toContain("MODERATOR-APPROVED");
    expect(homeSource).not.toContain("verificationEvidence");
  });

  it("starts compact discovery without silently excluding eligible homes by move-in budget", () => {
    expect(homeSource).toContain("const [maxMoveInCash, setMaxMoveInCash] = useState(1_000_000);");
    expect(homeSource).toContain('<option value={1000000}>{labels.anyAmount}</option>');
  });
});
