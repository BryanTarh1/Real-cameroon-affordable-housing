import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const home = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/launch-refinements.css"), "utf8");
const locale = fs.readFileSync(path.resolve(process.cwd(), "client/src/lib/marketplaceLocale.ts"), "utf8");
const walkthroughRail = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/PremiumWalkthroughRail.tsx"), "utf8");
const appointments = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ViewingAppointmentConcierge.tsx"), "utf8");
const languageHook = fs.readFileSync(path.resolve(process.cwd(), "client/src/hooks/useMarketplaceLanguage.ts"), "utf8");
const globalCss = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("French discovery and media-first property flow", () => {
  it("keeps a persistent English/French language control and translated headline labels", () => {
    expect(languageHook).toContain('AHC_LANGUAGE_STORAGE_KEY = "ahc-language"');
    expect(languageHook).toContain("localStorage.getItem(AHC_LANGUAGE_STORAGE_KEY)");
    expect(languageHook).toContain("localStorage.setItem(AHC_LANGUAGE_STORAGE_KEY, next)");
    expect(home).toContain("toggleLanguage");
    expect(home).toContain("marketplaceCopy[language]");
    expect(locale).toContain('export type PublicLanguage = "en" | "fr"');
    expect(locale).toContain("Montant total à prévoir");
  });

  it("shows public media and the total before sign-in, then gates the breakdown and map", () => {
    expect(home).toContain("listing-media-preview");
    expect(home).toContain("detail-media-first");
    expect(home.indexOf("detail-media-first")).toBeLessThan(home.indexOf('className="total-panel"'));
    expect(home).toContain('isAuthenticated ? <><div className="detail-breakdown-heading">');
    expect(locale).toContain("Sign in for the cost breakdown and map.");
    expect(home).toContain('className="detail-map-section"');
    expect(home).toContain('className="map-gate-panel"');
  });

  it("does not invoke protected marketplace actions from an anonymous preview", () => {
    expect(home).toContain("if (!isAuthenticated) {");
    expect(locale).toContain('chatWhatsApp: "Chat on WhatsApp"');
    expect(home).toContain("{isAuthenticated && <><ViewingAppointmentRequest listing={listing} language={language} />");
    expect(home).toContain('onClick={contact}');
  });

  it("contains responsive styles for the new discovery controls", () => {
    expect(css).toContain(".protected-detail-gate");
    expect(css).toContain(".detail-map-section");
    expect(css).toContain(".media-led-market");
    expect(globalCss).toContain(".language-transition");
    expect(globalCss).toContain("prefers-reduced-motion:reduce");
  });

  it("localizes the remaining public discovery currency and appointment-status surfaces", () => {
    expect(walkthroughRail).toContain('language === "fr" ? "fr-FR" : "en-US"');
    expect(appointments).toContain("function appointmentStatusLabel");
    expect(appointments).toContain('requested: "Demandée"');
  });
});
