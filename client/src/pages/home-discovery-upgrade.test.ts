import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const home = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/launch-refinements.css"), "utf8");

describe("French discovery and media-first property flow", () => {
  it("keeps a persistent English/French language control and translated headline labels", () => {
    expect(home).toContain('type Language = "en" | "fr"');
    expect(home).toContain('localStorage.getItem("ahc-language")');
    expect(home).toContain('setLanguage(language === "en" ? "fr" : "en")');
    expect(home).toContain("Montant total à prévoir");
  });

  it("shows public media and the total before sign-in, then gates the breakdown and map", () => {
    expect(home).toContain("listing-media-preview");
    expect(home).toContain("detail-media-first");
    expect(home.indexOf("detail-media-first")).toBeLessThan(home.indexOf('className="total-panel"'));
    expect(home).toContain('isAuthenticated ? <><div className="detail-breakdown-heading">');
    expect(home).toContain("Sign in for the cost breakdown and map.");
    expect(home).toContain('className="detail-map-section"');
    expect(home).toContain('className="map-gate-panel"');
  });

  it("does not invoke protected marketplace actions from an anonymous preview", () => {
    expect(home).toContain("if (!isAuthenticated) {");
    expect(home).toContain("Sign in to contact this Agent.");
    expect(home).toContain("{isAuthenticated && <><ViewingAppointmentRequest listing={listing} />");
    expect(home).toContain('onClick={contact}');
  });

  it("contains responsive styles for the new discovery controls", () => {
    expect(css).toContain(".protected-detail-gate");
    expect(css).toContain(".detail-map-section");
    expect(css).toContain(".media-led-market");
  });
});
