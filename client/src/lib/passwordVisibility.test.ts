import { describe, expect, it } from "vitest";
import { getPasswordInputType } from "./passwordVisibility";

describe("getPasswordInputType", () => {
  it("keeps credentials masked until the user explicitly chooses to reveal them", () => {
    expect(getPasswordInputType(false)).toBe("password");
    expect(getPasswordInputType(true)).toBe("text");
  });
});
