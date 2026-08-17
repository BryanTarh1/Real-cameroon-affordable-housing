import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const home = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("French discovery and media-first property flow", () => {
  it("keeps a persistent English/French language control and translated headline labels", () => {
    expect(home).toContain('type Language = "en" | "fr"');
    expect(home).toContain('localStorage.getItem("ahc-language")');
    expect(home).toContain('setLanguage(language === "en" ? "fr" : "en")');
    expect(home).toContain("Montant total à prévoir");
  });

  it("shows listing media before the cost headline and keeps detail access authenticated", () => {
    expect(home).toContain("listing-media-preview");
    expect(home).toContain("detail-media-first");
    expect(home).toContain('resolveListingDetailAccess(isAuthenticated) === "detail"');
    expect(home.indexOf("detail-media-first")).toBeLessThan(home.indexOf('className="total-panel"'));
  });

  it("contains responsive styles for the new discovery controls", () => {
    expect(css).toContain(".language-toggle");
    expect(css).toContain(".listing-media-preview");
    expect(css).toContain("@media(max-width:720px)");
  });
});
