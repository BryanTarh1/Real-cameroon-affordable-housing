import { describe, expect, it } from "vitest";
import { getAgentAccessUiState } from "./agent-access-ui";

describe("paid agent workspace access messaging", () => {
  it("shows a seven-day renewal countdown and renewal action before access ends", () => {
    expect(getAgentAccessUiState({
      active: true,
      daysRemaining: 7,
      renewalRecommended: true,
      suspensionReason: null,
    })).toEqual({
      label: "ACCESS ACTIVE · 7 DAYS",
      notice: "Your access ends in 7 days. Renew now to avoid a pause in submissions and reconfirmations.",
      renewalCta: "Renew Agent Access",
    });
  });

  it("shows an explicit suspended-state explanation and renewal action after access expires", () => {
    const state = getAgentAccessUiState({
      active: false,
      daysRemaining: 0,
      renewalRecommended: false,
      suspensionReason: "Renew Agent Access before submitting new listings or reconfirming availability.",
    });

    expect(state.label).toBe("ACCESS SUSPENDED");
    expect(state.notice).toContain("reconfirming availability");
    expect(state.renewalCta).toBe("Renew Agent Access");
  });

  it("translates active and suspended access states for the French Agent workspace", () => {
    expect(getAgentAccessUiState({
      active: true,
      daysRemaining: 1,
      renewalRecommended: true,
      suspensionReason: null,
    }, "fr")).toEqual({
      label: "ACCÈS ACTIF · 1 JOUR",
      notice: "Votre accès se termine dans 1 jour. Renouvelez-le maintenant pour éviter une interruption des soumissions et des reconfirmations.",
      renewalCta: "Renouveler l’accès Agent",
    });

    expect(getAgentAccessUiState({
      active: false,
      daysRemaining: 0,
      renewalRecommended: false,
      suspensionReason: "Renew Agent Access before submitting new listings or reconfirming availability.",
    }, "fr")).toMatchObject({
      label: "ACCÈS SUSPENDU",
      renewalCta: "Renouveler l’accès Agent",
    });
  });
});
