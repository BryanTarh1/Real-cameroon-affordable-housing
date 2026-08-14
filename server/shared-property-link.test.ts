import { describe, expect, it } from "vitest";
import { isSocialPreviewBot, propertySpaRedirect } from "./_core/sharedPropertyLink";
import { buildPropertyOpenGraphDocument } from "./_core/openGraphPropertyPreview";

describe("public shared-property link routing", () => {
  it("recognises social crawlers that need public-only OpenGraph metadata", () => {
    expect(isSocialPreviewBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isSocialPreviewBot("facebookexternalhit/1.1")).toBe(true);
    expect(isSocialPreviewBot("Mozilla/5.0 Chrome/126")).toBe(false);
  });

  it("redirects a normal browser into the hash-routed SPA and safely encodes the property identifier", () => {
    expect(propertySpaRedirect("demo-published-bastos")).toBe("/#/property/demo-published-bastos");
    expect(propertySpaRedirect("listing / 4")).toBe("/#/property/listing%20%2F%204");
  });

  it("creates a WhatsApp-compatible public-only preview with a PNG card and no exact address", () => {
    const document = buildPropertyOpenGraphDocument({ id: "home/12", title: "Calm two-bedroom", neighborhood: "Jouvence", city: "Yaoundé", costs: { totalMoveInCashRequired: 240_000 } }, "https://ahc.example");

    expect(document).toContain('property="og:image" content="https://ahc.example/api/public/listings/home%2F12/share-card.png"');
    expect(document).toContain('property="og:image:type" content="image/png"');
    expect(document).toContain("Total Move-In Cash Required: 240,000 XAF");
    expect(document).toContain("Approximate landmark area only");
    expect(document).not.toContain("compound door");
  });
});
