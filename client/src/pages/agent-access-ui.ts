import { agentText, interpolateAgent } from "@/lib/agentWorkspaceLocale";
import type { PublicLanguage } from "@/lib/marketplaceLocale";

export type AgentAccessUiInput = {
  active: boolean;
  daysRemaining: number;
  renewalRecommended: boolean;
  suspensionReason: string | null;
};

/** Text used by the paid workspace so a status response always maps to a clear, actionable state. */
export function getAgentAccessUiState(access: AgentAccessUiInput, language: PublicLanguage = "en") {
  const plural = access.daysRemaining === 1 ? "" : "s";
  if (access.active) {
    return {
      label: interpolateAgent(agentText(language, "accessActive"), { days: access.daysRemaining, plural: language === "fr" ? plural.toUpperCase() : plural.toUpperCase() }),
      notice: access.renewalRecommended
        ? interpolateAgent(agentText(language, "accessEnding"), { days: access.daysRemaining, plural })
        : null,
      renewalCta: access.renewalRecommended ? agentText(language, "renewAgentAccess") : null,
    };
  }

  return {
    label: agentText(language, "accessSuspended"),
    notice: language === "en" && access.suspensionReason ? access.suspensionReason : agentText(language, "suspendedAccessNotice"),
    renewalCta: agentText(language, "renewAgentAccess"),
  };
}
