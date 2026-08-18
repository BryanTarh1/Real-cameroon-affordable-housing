import { describe, expect, it } from "vitest";
import { isAhcInterfaceTranslation, translateAhcInterfaceText } from "./uiFrench";

describe("AHC French interface translation", () => {
  it("keeps English copy untouched when English is selected", () => {
    expect(translateAhcInterfaceText("Save profile", "en")).toBe("Save profile");
  });

  it("translates shared form and protected-workspace controls into French", () => {
    expect(translateAhcInterfaceText("Save profile", "fr")).toBe("Enregistrer le profil");
    expect(translateAhcInterfaceText("Payment reconciliation", "fr")).toBe("Rapprochement des paiements");
    expect(translateAhcInterfaceText("Complete review", "fr")).toBe("Terminer l’examen");
  });

  it("prefers the most specific phrase before translating shorter fragments", () => {
    expect(translateAhcInterfaceText("No platform-service orders yet", "fr")).toBe("Aucune commande de service de plateforme pour le moment");
  });

  it("does not target unknown user-entered content for translation", () => {
    expect(isAhcInterfaceTranslation("Appartement lumineux près de Biyem-Assi")).toBe(false);
    expect(translateAhcInterfaceText("Appartement lumineux près de Biyem-Assi", "fr")).toBe("Appartement lumineux près de Biyem-Assi");
  });

  it("keeps technical identifiers and monetary values intact", () => {
    expect(translateAhcInterfaceText("AHC-ORD-1042 · 25,000 XAF", "fr")).toBe("AHC-ORD-1042 · 25,000 XAF");
  });
});
