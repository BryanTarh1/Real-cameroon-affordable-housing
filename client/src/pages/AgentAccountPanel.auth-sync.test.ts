import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AgentAccountPanel.tsx", import.meta.url), "utf8");

describe("AHC local sign-in cache synchronization", () => {
  it("writes the successful local account response into the shared auth query before route-dependent work continues", () => {
    expect(source).toContain("utils.auth.me.setData(undefined, user);");
    expect(source).toContain("await afterAuthentication();");
    expect(source).not.toContain("utils.auth.me.invalidate(), utils.agent.profile.invalidate()");
  });

  it("uses the same immediate cache synchronization for registration and existing-account sign-in", () => {
    expect(source).toContain("trpc.auth.registerLocalAgent.useMutation({");
    expect(source).toContain("trpc.auth.loginLocalAgent.useMutation({");
    expect((source.match(/utils\.auth\.me\.setData\(undefined, user\);/g) ?? []).length).toBe(2);
  });
});
