import { describe, expect, it } from "vitest";
import { getLocalAuthFailure, getLocalAuthUiCopy } from "./localAuthFeedback";

describe("local credential feedback", () => {
  it("gives a safe retry explanation for wrong credentials", () => {
    expect(getLocalAuthFailure({ code: "UNAUTHORIZED", message: "Invalid email or password." }, "en")).toEqual({
      title: "Email or password not recognised",
      body: "Check both details, complete the security check again, then try once more.",
    });
  });

  it("explains account lockouts without exposing account details", () => {
    expect(getLocalAuthFailure({ code: "TOO_MANY_REQUESTS", message: "Too many attempts." }, "en").body).toContain("15 minutes");
  });

  it("translates processing and credential guidance for French sign-in", () => {
    expect(getLocalAuthUiCopy("fr").signingIn).toBe("Connexion sécurisée en cours…");
    expect(getLocalAuthFailure({ code: "UNAUTHORIZED" }, "fr").title).toBe("E-mail ou mot de passe non reconnu");
  });
});
