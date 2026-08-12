import { describe, expect, it } from "vitest";
import { canUseOperations, resolveListingDetailAccess, resolveModeratorEntry } from "./roleAccess";

describe("role-specific entry decisions", () => {
  it("requires a seeker account only when a visitor opens a property detail", () => {
    expect(resolveListingDetailAccess(false)).toBe("sign_in");
    expect(resolveListingDetailAccess(true)).toBe("detail");
  });

  it("limits Field Moderator operations to explicitly assigned staff roles", () => {
    expect(canUseOperations("user")).toBe(false);
    expect(resolveModeratorEntry(null)).toBe("sign_in");
    expect(resolveModeratorEntry("moderator")).toBe("workspace");
    expect(resolveModeratorEntry("admin")).toBe("workspace");
  });
});
