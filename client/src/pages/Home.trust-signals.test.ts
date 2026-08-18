import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./launch-refinements.css", import.meta.url), "utf8");
const locale = readFileSync(new URL("../lib/marketplaceLocale.ts", import.meta.url), "utf8");

describe("public listing ownership and freshness signals", () => {
  it("renders the persisted supply-capacity declaration rather than a hard-coded agent claim", () => {
    expect(homeSource).toContain('supplyCapacity: "agent_representative" | "direct_owner"');
    expect(homeSource).toContain('listing.supplyCapacity === "direct_owner"');
    expect(homeSource).toContain('data-ownership={listing.supplyCapacity}');
    expect(homeSource).not.toContain('<b>{text(language, "managingAgent")} · {listing.agent.name}</b>');
  });

  it("provides bilingual ownership labels and makes freshness visible on each card", () => {
    expect(locale).toContain('directOwner: "Direct From Owner"');
    expect(locale).toContain('directOwner: "Propriétaire direct"');
    expect(homeSource).toContain('freshness-relative freshness-indicator');
    expect(styles).toContain('.freshness-indicator');
    expect(styles).toContain('[data-ownership="direct_owner"]');
  });
});
