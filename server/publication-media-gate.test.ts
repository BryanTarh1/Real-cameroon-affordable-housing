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
  it("requires current physical verification, a clear description, and five approved photos or a published walkthrough before a real listing is returned publicly", () => {
    expect(databaseSource).toContain('if (getEffectivePublicVerificationStatus(listing.verificationStatus, listing.verificationExpiresAt) !== "physical_verified")');
    expect(databaseSource).toContain("if (!listing.description || listing.description.trim().length < 40)");
    expect(databaseSource).toContain("if (listing.publicMedia.length < 5 && !listing.walkthrough) return false;");
    expect(databaseSource).toContain("A listing needs five approved public photos or a published moderator walkthrough before it can be public.");
    expect(publicListingSource).toContain('if (!listing.isTestData && listing.verificationStatus !== "physical_verified") return false;');
    expect(publicListingSource).toContain('if ((!listing.description || listing.description.trim().length < 40) && !listing.isTestData) return false;');
  });

  it("projects approved public-gallery records without selecting private verification-evidence media", () => {
    expect(publicListingSource).toContain("from(listingPublicMedia)");
    expect(publicListingSource).toContain("mediaByListingId.get(row.id) ?? []");
    expect(publicListingSource).not.toContain("verificationEvidence.mediaUrl");
  });

  it("keeps illustrative TEST DATA media explicitly separate from genuine approved public-gallery evidence", () => {
    expect(databaseSource).toContain("listingIllustrativeTestMedia");
    expect(databaseSource).toContain('provenance: "illustrative_test_data"');
    expect(databaseSource).toContain("const testListingIds = rows.filter(row => Boolean(row.isTestData)).map(row => row.id);");
    expect(publicListingSource).toContain("eq(listings.isTestData, true)");
    expect(publicListingSource).toContain("const illustrativeLibrary = Array.from(mediaByListingId.values())");
    expect(databaseSource).toContain("if (listing.publicMedia.length < 5 && !listing.walkthrough) return false;");
  });

  it("keeps inconsistent TEST DATA facts out of the public catalogue without relaxing live-home safeguards", () => {
    expect(publicListingSource).toContain("listing.isTestData && (");
    expect(publicListingSource).toContain("listing.bathrooms < 1");
    expect(publicListingSource).toContain('listing.propertyType === "Studio" ? listing.bedrooms !== 0 : listing.bedrooms < 1');
    expect(publicListingSource).toContain("listing.parkingSpaces < 0");
    expect(publicListingSource).toContain("listing.amenities.length < 1");
  });

  it("builds related-home suggestions only from already-public listing projections", () => {
    expect(relatedListingSource).toContain("const publicListings = await listFreshPublicListings();");
    expect(relatedListingSource).toContain("filter((listing) => listing.id !== listingId)");
    expect(relatedListingSource).not.toContain("shortlistedListings");
    expect(relatedListingSource).not.toContain("verificationEvidence");
  });
});
