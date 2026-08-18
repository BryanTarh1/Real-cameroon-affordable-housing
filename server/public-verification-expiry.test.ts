import { describe, expect, it } from "vitest";
import { getEffectivePublicVerificationStatus } from "./db";

describe("public physical-verification validity", () => {
  const now = new Date("2026-08-18T10:00:00.000Z").getTime();

  it("keeps a physical badge only while its saved field-verification period is active", () => {
    expect(getEffectivePublicVerificationStatus("physical_verified", new Date("2026-08-18T10:00:01.000Z"), now)).toBe("physical_verified");
    expect(getEffectivePublicVerificationStatus("physical_verified", new Date("2026-08-18T10:00:00.000Z"), now)).toBe("unverified");
  });

  it("never promotes expired or missing verification evidence to a public physical badge", () => {
    expect(getEffectivePublicVerificationStatus("physical_verified", null, now)).toBe("unverified");
    expect(getEffectivePublicVerificationStatus("physical_verified", new Date("2026-08-17T10:00:00.000Z"), now)).toBe("unverified");
    expect(getEffectivePublicVerificationStatus("remote_checked", null, now)).toBe("remote_checked");
  });
});
