import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("non-production listing disclosures", () => {
  it("renders the stored listing title on public cards without stripping the TEST DATA prefix", () => {
    expect(homeSource).toContain("<h3>{listing.title}</h3>");
  });

  it("recognises the TEST DATA marker in the protected detail experience", () => {
    expect(homeSource).toContain('const isNonProductionFixture = listing.title.startsWith("TEST DATA")');
    expect(homeSource).toContain('text(language, "tourTest")');
    expect(homeSource).toContain('text(language, "testVideoHeading")');
  });
});
