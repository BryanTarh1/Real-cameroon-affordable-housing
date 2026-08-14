import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client", "src", "pages", "Home.tsx"), "utf8");

describe("public listing verification copy", () => {
  it("distinguishes a passed physical visit from a reviewed listing awaiting an on-site visit", () => {
    expect(homeSource).toContain("Physically verified by AHC");
    expect(homeSource).toContain("Field Moderator visit passed");
    expect(homeSource).toContain("Not yet physically verified");
    expect(homeSource).toContain("no on-site Field Moderator visit yet");
  });

  it("keeps relative reconfirmation separate from verification status", () => {
    expect(homeSource).toContain("Reconfirmed {relativeReconfirmed(listing.lastReconfirmed)}");
  });
});
