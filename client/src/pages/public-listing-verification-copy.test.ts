import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client", "src", "pages", "Home.tsx"), "utf8");
const localeSource = readFileSync(resolve(process.cwd(), "client", "src", "lib", "marketplaceLocale.ts"), "utf8");

describe("public listing verification copy", () => {
  it("distinguishes a passed physical visit from a reviewed listing awaiting an on-site visit", () => {
    expect(localeSource).toContain("Physically verified by AHC");
    expect(localeSource).toContain("Field Moderator visit passed");
    expect(localeSource).toContain("Not yet physically verified");
    expect(localeSource).toContain("no on-site Field Moderator visit yet");
  });

  it("keeps relative reconfirmation separate from verification status", () => {
    expect(homeSource).toContain("relativeReconfirmed(listing.lastReconfirmed, language)");
    expect(localeSource).toContain('reconfirmed: "Reconfirmed"');
    expect(localeSource).toContain('reconfirmed: "Reconfirmé"');
  });
});
