import { describe, expect, it } from "vitest";
import { legacyHashPathToBrowserPath } from "./legacyHashRoutes";

describe("legacyHashPathToBrowserPath", () => {
  it("converts former AHC workspace and shared-listing links into normal paths", () => {
    expect(legacyHashPathToBrowserPath("#/admin")).toBe("/admin");
    expect(legacyHashPathToBrowserPath("#/property/demo-published-bastos?shared=1")).toBe("/property/demo-published-bastos?shared=1");
  });

  it("does not treat in-page fragments or protocol-relative paths as routable browser paths", () => {
    expect(legacyHashPathToBrowserPath("#homes")).toBeNull();
    expect(legacyHashPathToBrowserPath("#//external.example")).toBeNull();
  });
});
