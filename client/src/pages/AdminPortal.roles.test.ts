import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminPortalSource = readFileSync(new URL("./AdminPortal.tsx", import.meta.url), "utf8");

describe("Admin Portal role assignment", () => {
  it("offers Seeker and Agent as separate persisted role choices", () => {
    expect(adminPortalSource).toContain('<option value="seeker">Seeker</option>');
    expect(adminPortalSource).toContain('<option value="agent">Agent</option>');
    expect(adminPortalSource).toContain('"seeker" | "agent" | "moderator" | "admin"');
  });

  it("does not restore the retired combined user role in the selector", () => {
    expect(adminPortalSource).not.toContain('<option value="user">Seeker or Agent</option>');
    expect(adminPortalSource).not.toContain('<option value="user">Seeker / Agent</option>');
  });
});
