export type AgentAccessUiInput = {
  active: boolean;
  daysRemaining: number;
  renewalRecommended: boolean;
  suspensionReason: string | null;
};

/** Text used by the paid workspace so a status response always maps to a clear, actionable state. */
export function getAgentAccessUiState(access: AgentAccessUiInput) {
  if (access.active) {
    return {
      label: `ACCESS ACTIVE · ${access.daysRemaining} DAY${access.daysRemaining === 1 ? "" : "S"}`,
      notice: access.renewalRecommended
        ? `Your access ends in ${access.daysRemaining} day${access.daysRemaining === 1 ? "" : "s"}. Renew now to avoid a pause in submissions and reconfirmations.`
        : null,
      renewalCta: access.renewalRecommended ? "Renew Agent Access" : null,
    };
  }

  return {
    label: "ACCESS SUSPENDED",
    notice: access.suspensionReason ?? "Renew Agent Access before submitting new listings or reconfirming availability.",
    renewalCta: "Renew Agent Access",
  };
}
