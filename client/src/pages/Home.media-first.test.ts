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
});
