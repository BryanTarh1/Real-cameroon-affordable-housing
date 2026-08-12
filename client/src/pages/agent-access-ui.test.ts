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
});
