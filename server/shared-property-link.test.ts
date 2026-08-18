import { describe, expect, it } from "vitest";
import { isSocialPreviewBot, propertySpaRedirect } from "./_core/sharedPropertyLink";
import { buildPropertyOpenGraphDocument } from "./_core/openGraphPropertyPreview";

describe("public shared-property link routing", () => {
  it("recognises social crawlers that need public-only OpenGraph metadata", () => {
    expect(isSocialPreviewBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isSocialPreviewBot("facebookexternalhit/1.1")).toBe(true);
    expect(isSocialPreviewBot("Mozilla/5.0 Chrome/126")).toBe(false);
  });

  it("provides a normal browser path and safely encodes the property identifier", () => {
    expect(propertySpaRedirect("demo-published-bastos")).toBe("/property/demo-published-bastos");
    expect(propertySpaRedirect("listing / 4")).toBe("/property/listing%20%2F%204");
  });

  it("creates a WhatsApp-compatible public-only preview with objective trust facts and no exact address", () => {
    const document = buildPropertyOpenGraphDocument({ id: "home/12", title: "Calm two-bedroom", propertyType: "Apartment", neighborhood: "Jouvence", city: "Yaoundé", verificationStatus: "physical_verified", supplyCapacity: "direct_owner", costs: { totalMoveInCashRequired: 240_000 } }, "https://ahc.example");

    expect(document).toContain('property="og:image" content="https://ahc.example/api/public/listings/home%2F12/share-card.png"');
    expect(document).toContain('property="og:image:secure_url" content="https://ahc.example/api/public/listings/home%2F12/share-card.png"');
    expect(document).toContain('property="og:image:type" content="image/png"');
    expect(document).toContain('property="og:locale" content="en_CM"');
    expect(document).toContain("Apartment. Physically verified by AHC. Direct From Owner.");
    expect(document).toContain("Total Move-In Cash Required: 240,000 XAF");
    expect(document).toContain("Approximate landmark area only");
    expect(document).toContain("the compound door is private");
    expect(document).not.toContain("street address");
  });
});
