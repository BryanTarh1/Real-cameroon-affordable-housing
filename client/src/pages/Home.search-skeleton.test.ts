import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./Home.search-skeleton.css", import.meta.url), "utf8");

describe("public property search loading skeleton", () => {
  it("keeps a dedicated pending branch while search results refresh", () => {
    expect(homeSource).toContain('results.isLoading ? <div className="loading-list"><i /><i /><i /></div>');
    expect(homeSource).toContain("labels.checkingFreshness");
  });

  it("uses card-shaped media, cost, and text placeholders that match the public listing grid", () => {
    expect(styles).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(styles).toContain("100% 270px");
    expect(styles).toContain(".loading-list i::before");
    expect(styles).toContain("ahc-card-skeleton-shimmer");
  });

  it("collapses to a single column and disables shimmer for reduced-motion users", () => {
    expect(styles).toContain("@media (max-width: 620px)");
    expect(styles).toContain(".loading-list { grid-template-columns: 1fr; }");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
