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
const agentConcierge = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/AgentViewingConcierge.tsx"), "utf8");
const agentQuality = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/AgentQualityDashboard.tsx"), "utf8");
const costDisclosure = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/CostDisclosureForm.tsx"), "utf8");

describe("French discovery and media-first property flow", () => {
  it("keeps a persistent English/French language-selection dropdown and translated headline labels", () => {
    expect(languageHook).toContain('AHC_LANGUAGE_STORAGE_KEY = "ahc-language"');
    expect(languageHook).toContain("localStorage.getItem(AHC_LANGUAGE_STORAGE_KEY)");
    expect(languageHook).toContain("localStorage.setItem(AHC_LANGUAGE_STORAGE_KEY, next)");
    expect(home).toContain("setLanguage");
    expect(home).toContain('className="language-select"');
    expect(home).toContain('<option value="en">English</option><option value="fr">Français</option>');
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
    expect(home).toContain("<ViewingAppointmentRequest listing={listing} language={language}");
    expect(home).toContain('className="protected-detail-gate shortlist-panel"');
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
    expect(appointments).toContain('requested: "Demandée — en attente de l’Agent"');
    expect(appointments).toContain('Agent responded — viewing scheduled');
    expect(appointments).toContain('Never send rent, a deposit, or tenancy funds through this request.');
  });

  it("keeps budget guidance, price changes, and low-data choice in the public discovery workflow", () => {
    expect(home).toContain("budgetFitOnly");
    expect(home).toContain("monthlyIncome");
    expect(home).toContain("availableSavings");
    expect(home).toContain("marketplace.priceHistory");
    expect(home).toContain("lowDataMode");
    expect(home).toContain("Data saver on");
  });

  it("keeps availability reconfirmation, structured outcomes, and Agent quality linked to protected APIs", () => {
    expect(appointments).toContain("recordSeekerOutcome");
    expect(agentConcierge).toContain("reconfirmAvailability");
    expect(agentQuality).toContain("agent.qualityDashboard");
    expect(costDisclosure).toContain("agent.updateCosts");
  });
});
