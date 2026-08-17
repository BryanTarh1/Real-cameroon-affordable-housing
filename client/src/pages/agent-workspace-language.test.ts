import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const portal = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/PaidAgentPortal.tsx"), "utf8");
const agentLocale = fs.readFileSync(path.resolve(process.cwd(), "client/src/lib/agentWorkspaceLocale.ts"), "utf8");
const languageHook = fs.readFileSync(path.resolve(process.cwd(), "client/src/hooks/useMarketplaceLanguage.ts"), "utf8");
const globalCss = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("standalone Agent workspace language support", () => {
  it("uses the same persisted locale source as public marketplace discovery", () => {
    expect(portal).toContain("useMarketplaceLanguage()");
    expect(languageHook).toContain('AHC_LANGUAGE_STORAGE_KEY = "ahc-language"');
    expect(languageHook).toContain("window.addEventListener(\"storage\"");
    expect(portal).toContain('className="language-select agent-language-select"');
    expect(portal).toContain('<option value="en">English</option><option value="fr">Français</option>');
  });

  it("provides centralized French copy for the profile, identity, payments, and listings", () => {
    expect(agentLocale).toContain("Profil et statut d’identité");
    expect(agentLocale).toContain("Numéro de contribuable");
    expect(agentLocale).toContain("Accès payant, avant contrôle");
    expect(agentLocale).toContain("Ajouter une annonce transparente");
    expect(portal).toContain('copy("profileIdentity")');
    expect(portal).toContain('copy("paidAccess")');
    expect(portal).toContain('copy("addListing")');
  });

  it("applies restrained language-change feedback while respecting reduced-motion preferences", () => {
    expect(portal).toContain("isLanguageTransitioning");
    expect(portal).toContain("language-transition");
    expect(globalCss).toContain(".language-transition.is-switching-language");
    expect(globalCss).toContain("@media(prefers-reduced-motion:reduce)");
  });
});
