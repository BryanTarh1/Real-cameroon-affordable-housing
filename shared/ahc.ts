export const FRESHNESS_WINDOW_DAYS = 14;
export const APPROXIMATE_RADIUS_MIN_M = 200;
export const APPROXIMATE_RADIUS_MAX_M = 500;

export const AHC_PAID_OFFERS = {
  agentAccess: { amountXaf: 3_000, validityDays: 30, label: "Agent Access" },
  listingPass: { amountXaf: 1_000, validityDays: 90, label: "Listing Pass" },
  featuredPin: { amountXaf: 3_000, validityDays: 14, label: "Featured Landmark Pin" },
  physicalVerification: { amountXaf: 7_500, validityDays: 30, label: "Physical Verification" },
} as const;

export type PaidOfferType = "agent_access" | "listing_pass" | "featured_pin" | "physical_verification";

export const DEFAULT_FIELD_MODERATOR_SHARE_BPS = 8_000;
export const BASIS_POINTS_DENOMINATOR = 10_000;

/** Splits a successfully completed field-verification fee; the platform remainder is never rounded away. */
export function calculateFieldVerificationCommission(grossAmountXaf: number, fieldModeratorShareBps = DEFAULT_FIELD_MODERATOR_SHARE_BPS) {
  if (!Number.isInteger(grossAmountXaf) || grossAmountXaf < 0) throw new Error("Commissionable amount must be a non-negative whole XAF value.");
  if (!Number.isInteger(fieldModeratorShareBps) || fieldModeratorShareBps < 0 || fieldModeratorShareBps > BASIS_POINTS_DENOMINATOR) throw new Error("Field Moderator share must be between 0 and 10,000 basis points.");
  const fieldModeratorAmountXaf = Math.floor((grossAmountXaf * fieldModeratorShareBps) / BASIS_POINTS_DENOMINATOR);
  return {
    grossAmountXaf,
    fieldModeratorShareBps,
    fieldModeratorAmountXaf,
    platformAmountXaf: grossAmountXaf - fieldModeratorAmountXaf,
  };
}

export type AgentSubscriptionStatus = "pending_payment" | "active" | "past_due" | "suspended" | "expired";

/**
 * The authoritative access rule used before agents submit or reconfirm inventory.
 * A profile marked active without a valid end date is intentionally not treated as paid access.
 */
export function getAgentAccessState(
  subscriptionStatus: AgentSubscriptionStatus,
  subscriptionExpiresAt: Date | string | null | undefined,
  now = new Date(),
) {
  const expiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
  const hasValidExpiry = Boolean(expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() >= now.getTime());
  const active = subscriptionStatus === "active" && hasValidExpiry;
  const daysRemaining = active && expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000))
    : 0;
  return {
    active,
    daysRemaining,
    renewalRecommended: active && daysRemaining <= 7,
    shouldMarkExpired: subscriptionStatus === "active" && !active,
    suspensionReason: active ? null : "Renew Agent Access before submitting new listings or reconfirming availability.",
  };
}

export function getPaidOffer(type: PaidOfferType) {
  const offerByType = {
    agent_access: AHC_PAID_OFFERS.agentAccess,
    listing_pass: AHC_PAID_OFFERS.listingPass,
    featured_pin: AHC_PAID_OFFERS.featuredPin,
    physical_verification: AHC_PAID_OFFERS.physicalVerification,
  } as const;
  return offerByType[type];
}

export type MoveInCostInput = {
  monthlyRent: number;
  advanceMonths: number;
  securityDeposit: number;
  agencyFee: number;
  serviceFee: number;
  firstMonthUtilities: number;
};

export function calculateTotalMoveInCash(cost: MoveInCostInput): number {
  return cost.monthlyRent * cost.advanceMonths
    + cost.securityDeposit
    + cost.agencyFee
    + cost.serviceFee
    + cost.firstMonthUtilities;
}

export function getReconfirmationDeadline(lastReconfirmed: Date | string): Date {
  const source = new Date(lastReconfirmed);
  return new Date(source.getTime() + FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function isListingFresh(lastReconfirmed: Date | string, now = new Date()): boolean {
  return getReconfirmationDeadline(lastReconfirmed).getTime() >= now.getTime();
}

export function normalizeCameroonWhatsAppPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const withoutCountryPrefix = digits.startsWith("237") ? digits.slice(3) : digits;
  if (!/^[23689]\d{8}$/.test(withoutCountryPrefix)) {
    throw new Error("Use a valid Cameroon mobile number, for example 6XXXXXXXX or +237 6XXXXXXXX.");
  }
  return `237${withoutCountryPrefix}`;
}

export function createWhatsAppListingLink(agentPhone: string, listingId: string): string {
  const normalizedPhone = normalizeCameroonWhatsAppPhone(agentPhone);
  const text = `Hi, I found Listing ${listingId} on AHC`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

export function createApproximatePoint(
  latitude: number,
  longitude: number,
  radiusM: number,
  random = Math.random,
): { latitude: number; longitude: number; radiusM: number } {
  const safeRadius = Math.max(APPROXIMATE_RADIUS_MIN_M, Math.min(APPROXIMATE_RADIUS_MAX_M, Math.round(radiusM)));
  const bearing = random() * 2 * Math.PI;
  // Shift between 200m and the selected maximum, never expose the submitted reference coordinate.
  const distance = APPROXIMATE_RADIUS_MIN_M + random() * (safeRadius - APPROXIMATE_RADIUS_MIN_M);
  const earthRadiusM = 6_371_000;
  const angularDistance = distance / earthRadiusM;
  const lat = (latitude * Math.PI) / 180;
  const lng = (longitude * Math.PI) / 180;

  const shiftedLat = Math.asin(
    Math.sin(lat) * Math.cos(angularDistance)
      + Math.cos(lat) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const shiftedLng = lng + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat),
    Math.cos(angularDistance) - Math.sin(lat) * Math.sin(shiftedLat),
  );

  return {
    latitude: Number(((shiftedLat * 180) / Math.PI).toFixed(7)),
    longitude: Number(((shiftedLng * 180) / Math.PI).toFixed(7)),
    radiusM: safeRadius,
  };
}
