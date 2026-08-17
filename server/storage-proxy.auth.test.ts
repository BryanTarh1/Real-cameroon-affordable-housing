import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("storage proxy authorization boundary", () => {
  const source = readFileSync(resolve(process.cwd(), "server/_core/storageProxy.ts"), "utf8");

  it("authenticates private object requests before requesting a signed storage URL", () => {
    expect(source).toContain("authenticateLocalRequest(req)");
    expect(source).toContain("canReadPrivateStorageKey(key, user)");
    expect(source).toContain("res.status(403).send(\"Private file access is not permitted\")");
    expect(source.indexOf("canReadPrivateStorageKey(key, user)")).toBeLessThan(source.indexOf("v1/storage/presign/get"));
  });

  it("allows field walkthrough delivery only through the published-media access policy", () => {
    expect(source).toContain("getWalkthroughStorageAccess(key)");
    expect(source).toContain("canReadWalkthroughStorageKey(walkthrough, user)");
    expect(source).toContain("res.status(403).send(\"Walkthrough media access is not permitted\")");
  });
});
