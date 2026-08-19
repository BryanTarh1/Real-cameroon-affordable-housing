import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./LocaleDocumentTranslator.tsx", import.meta.url), "utf8");

describe("LocaleDocumentTranslator", () => {
  it("hides the floating language selector on the public marketplace while retaining it on protected routes", () => {
    expect(source).toContain('import { useLocation } from "wouter"');
    expect(source).toContain('location === "/" || location.startsWith("/listings/")');
    expect(source).toContain("if (isPublicMarketplace) return null;");
    expect(source).toContain('aria-label="Language selector"');
    expect(source).toContain('aria-label="Select language"');
  });

  it("only translates static interface attributes and respects an explicit opt-out boundary", () => {
    expect(source).toContain("data-ahc-no-translate");
    expect(source).toContain('[placeholder], [title], [aria-label]');
    expect(source).toContain("data-ahc-original-");
  });
});
