import { describe, expect, it } from "vitest";
import { marketplaceCopy } from "./marketplaceLocale";

describe("concise homepage marketplace copy", () => {
  it("keeps the English promise brief while retaining core trust disclosures", () => {
    const copy = marketplaceCopy.en;

    expect(copy.freshHeading).toBe("Fresh homes only.");
    expect(copy.freshIntro).toContain("total move-in cash");
    expect(copy.mapPrivacyKey).toContain("200–500m landmark area");
    expect(copy.trustFreshBody).toContain("14 days");
    expect(copy.moderatorVisitPassed).toContain("Field Moderator visit passed");
    expect(copy.noRentBody).toContain("not an escrow, rent-collection, or deposit-holding service");
    expect(copy.protectVisitBody).toContain("Do not send a deposit before you inspect");
  });

  it("keeps the French promise direct while retaining map and payment safeguards", () => {
    const copy = marketplaceCopy.fr;

    expect(copy.freshHeading).toBe("Seulement des logements récents.");
    expect(copy.freshIntro).toContain("montant total");
    expect(copy.mapPrivacyKey).toContain("200–500 m");
    expect(copy.trustFreshBody).toContain("14 jours");
    expect(copy.moderatorVisitPassed).toContain("Visite du modérateur terrain validée");
    expect(copy.noRentBody).toContain("ni un séquestre, ni un service de collecte de loyer ou de dépôt");
    expect(copy.protectVisitBody).toContain("N’envoyez pas de caution avant d’inspecter");
  });
});
