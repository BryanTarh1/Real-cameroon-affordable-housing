import { describe, expect, it } from "vitest";
import { canAccessWorkspace } from "./workspaceAccess";

describe("workspace route access", () => {
  it("allows only administrators into the Admin workspace", () => {
    expect(canAccessWorkspace("admin", ["admin"])).toBe(true);
    expect(canAccessWorkspace("moderator", ["admin"])).toBe(false);
    expect(canAccessWorkspace("user", ["admin"])).toBe(false);
    expect(canAccessWorkspace(null, ["admin"])).toBe(false);
  });

  it("allows administrators and designated moderators into Operations only", () => {
    expect(canAccessWorkspace("admin", ["admin", "moderator"])).toBe(true);
    expect(canAccessWorkspace("moderator", ["admin", "moderator"])).toBe(true);
    expect(canAccessWorkspace("user", ["admin", "moderator"])).toBe(false);
  });
});
