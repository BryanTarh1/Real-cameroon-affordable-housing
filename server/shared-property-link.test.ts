import { describe, expect, it } from "vitest";
import { isSocialPreviewBot, propertySpaRedirect } from "./_core/sharedPropertyLink";

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
});
