import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const databaseSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const publicListingSource = databaseSource.slice(
  databaseSource.indexOf("export async function listFreshPublicListings"),
  databaseSource.indexOf("export async function getPublicListingContact"),
);
const relatedListingSource = databaseSource.slice(
  databaseSource.indexOf("export async function listRelatedPublicListings"),
  databaseSource.indexOf("export async function getPublicListingContact"),
);

describe("public listing media and confirmation gate", () => {
  it("requires current physical verification, a clear description, and five approved photos or a published walkthrough before a listing is returned publicly", () => {
    expect(databaseSource).toContain('if (listing.verificationStatus !== "physical_verified") return false;');
    expect(databaseSource).toContain("if (!listing.description || listing.description.trim().length < 40) return false;");
    expect(databaseSource).toContain("if (listing.publicMedia.length < 5 && !listing.walkthrough) return false;");
    expect(databaseSource).toContain("A listing needs five approved public photos or a published moderator walkthrough before it can be public.");
  });

  it("projects approved public-gallery records without selecting private verification-evidence media", () => {
    expect(publicListingSource).toContain("from(listingPublicMedia)");
    expect(publicListingSource).toContain("mediaByListingId.get(row.id) ?? []");
    expect(publicListingSource).not.toContain("verificationEvidence.mediaUrl");
  });

  it("builds related-home suggestions only from already-public listing projections", () => {
    expect(relatedListingSource).toContain("const publicListings = await listFreshPublicListings();");
    expect(relatedListingSource).toContain("filter((listing) => listing.id !== listingId)");
    expect(relatedListingSource).not.toContain("shortlistedListings");
    expect(relatedListingSource).not.toContain("verificationEvidence");
  });
});
