import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./PaidAgentPortal.tsx", import.meta.url), "utf8");

describe("Agent sign-in locale propagation", () => {
  it("passes the selected workspace language into the public Agent account panel", () => {
    expect(source).toContain('<AgentAccountPanel language={language} />');
  });
});
