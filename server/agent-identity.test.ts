import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Agent identity evidence boundaries", () => {
  it("accepts only authenticated JPG uploads and stores private keys", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(source).toContain('/api/agent/identity-document');
    expect(source).toContain('image/jpeg');
    expect(source).toContain('private/agent-identity/');
    expect(source).toContain('user.role !== "user"');
    expect(source).toContain('saveAgentIdentityDocument');
  });

  it("does not expose identity document URLs in the status query", () => {
    const source = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(source).toContain("taxpayerNumberPresent");
    expect(source).toContain("idFrontUploaded");
    expect(source).toContain("idBackUploaded");
    expect(source).toContain("idFaceUploaded");
    expect(source).not.toContain("governmentIdFrontUrl");
  });
});
