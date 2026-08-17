export const SUPPORTED_MOBILE_MONEY_PROVIDERS = ["mtn_momo", "orange_money"] as const;

export type SupportedMobileMoneyProvider = (typeof SUPPORTED_MOBILE_MONEY_PROVIDERS)[number];

const PROVIDER_LABELS: Record<SupportedMobileMoneyProvider, string> = {
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
};

/**
 * Returns one canonical, non-sensitive reference representation for matching.
 * AHC stores no wallet PIN, OTP, or account balance; this value is only proof
 * for a platform-service order until Admin or provider reconciliation confirms it.
 */
export function normalizeMobileMoneyReference(reference: string) {
  const normalized = reference.trim().toUpperCase().replace(/[\s-]+/g, "");
  if (normalized.length < 6 || normalized.length > 120 || !/^[A-Z0-9]+$/.test(normalized)) {
    throw new Error("Enter the provider transaction reference using letters and numbers only.");
  }
  return normalized;
}

export function getMobileMoneyProviderLabel(provider: SupportedMobileMoneyProvider) {
  return PROVIDER_LABELS[provider];
}

export function isDuplicateProviderReferenceError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : undefined;
  const message = error instanceof Error ? error.message : "";
  return code === "ER_DUP_ENTRY" || /duplicate entry|payment_orders_provider_reference_unique/i.test(message);
}
