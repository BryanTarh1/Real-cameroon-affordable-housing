import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const databaseSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const publicListingSource = databaseSource.slice(
  databaseSource.indexOf("export async function listFreshPublicListings"),
  databaseSource.indexOf("export async function getPublicListingContact"),
);

describe("public listing media and confirmation gate", () => {
  it("requires a current physical verification and curator-approved photo or published walkthrough before a listing is returned publicly", () => {
    expect(databaseSource).toContain('if (listing.verificationStatus !== "physical_verified") return false;');
    expect(databaseSource).toContain("if (!listing.publicMedia.length && !listing.walkthrough) return false;");
  });

  it("projects approved public-gallery records without selecting private verification-evidence media", () => {
    expect(publicListingSource).toContain("from(listingPublicMedia)");
    expect(publicListingSource).toContain("mediaByListingId.get(row.id) ?? []");
    expect(publicListingSource).not.toContain("verificationEvidence.mediaUrl");
  });
});
