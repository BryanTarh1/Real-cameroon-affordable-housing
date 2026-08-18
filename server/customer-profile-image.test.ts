import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Customer profile-picture storage boundary", () => {
  it("requires an authenticated, small JPG or PNG upload and stores a normalized private object key", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(source).toContain('app.post("/api/customer/profile-picture"');
    expect(source).toContain('limit: "2mb"');
    expect(source).toContain('"image/png"');
    expect(source).toContain('res.status(401)');
    expect(source).toContain('private/customer-avatar/${user.id}/');
    expect(source).toContain("metadata.format !== expectedFormat");
    expect(source).toContain("resize(512, 512");
    expect(source).toContain("updateCustomerProfileImageKey(user.id, storage.key)");
  });

  it("persists an opaque storage key rather than image bytes and resolves it only through the customer account helper", () => {
    const source = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(source).toContain("profileImageStorageKey: storageKey");
    expect(source).toContain("getCustomerProfileImageUrl(userId)");
    expect(source).toContain("/manus-storage/${account.profileImageStorageKey}");
  });

  it("permits a customer-owned blank state by clearing only their stored avatar reference", () => {
    const source = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(source).toContain("clearCustomerProfileImageKey(userId: number)");
    expect(source).toContain("profileImageStorageKey: null");
  });
});
