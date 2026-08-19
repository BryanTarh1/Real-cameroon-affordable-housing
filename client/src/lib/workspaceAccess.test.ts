import { describe, expect, it } from "vitest";
import { canAccessWorkspace, workspaceHomeForRole } from "./workspaceAccess";

describe("workspace route access", () => {
  it("allows only administrators into the Admin workspace", () => {
    expect(canAccessWorkspace("admin", ["admin"])).toBe(true);
    expect(canAccessWorkspace("moderator", ["admin"])).toBe(false);
    expect(canAccessWorkspace("seeker", ["admin"])).toBe(false);
    expect(canAccessWorkspace("agent", ["admin"])).toBe(false);
    expect(canAccessWorkspace(null, ["admin"])).toBe(false);
  });

  it("allows administrators and designated moderators into Operations only", () => {
    expect(canAccessWorkspace("admin", ["admin", "moderator"])).toBe(true);
    expect(canAccessWorkspace("moderator", ["admin", "moderator"])).toBe(true);
    expect(canAccessWorkspace("seeker", ["admin", "moderator"])).toBe(false);
    expect(canAccessWorkspace("agent", ["admin", "moderator"])).toBe(false);
  });

  it("returns each role to a safe allowed workspace rather than trusting a manually edited hash path", () => {
    expect(workspaceHomeForRole("admin")).toBe("/admin");
    expect(workspaceHomeForRole("moderator")).toBe("/operations");
    expect(workspaceHomeForRole("seeker")).toBe("/account");
    expect(workspaceHomeForRole("agent")).toBe("/agent");
    expect(workspaceHomeForRole(null)).toBe("/");
    expect(workspaceHomeForRole("unknown")).toBe("/");
  });
});
