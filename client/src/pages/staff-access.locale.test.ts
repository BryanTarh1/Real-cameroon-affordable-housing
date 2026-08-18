import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const readPage = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

describe("staff access locale propagation", () => {
  it.each(["AdminAccess.tsx", "ModeratorAccess.tsx"])("uses the shared language and passes it to the account form in %s", page => {
    const source = readPage(page);
    expect(source).toContain('import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage"');
    expect(source).toContain("const { language } = useMarketplaceLanguage()");
    expect(source).toContain("language={language}");
  });

  it("keeps French staff-access guidance in source instead of relying only on text replacement", () => {
    const admin = readPage("AdminAccess.tsx");
    const moderator = readPage("ModeratorAccess.tsx");
    expect(admin).toContain("Connectez-vous à l’administration de la plateforme.");
    expect(moderator).toContain("Connectez-vous aux opérations terrain.");
  });
});
