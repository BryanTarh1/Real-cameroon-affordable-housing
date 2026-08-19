export const FRESHNESS_WINDOW_DAYS = 14;
export const APPROXIMATE_RADIUS_MIN_M = 200;
export const APPROXIMATE_RADIUS_MAX_M = 500;

/**
 * Commercial constants are duplicated here only as the safe fallback contract.
 * Administrators may alter live XAF amounts in governed platform settings, but not
 * the entitlement counts, first-month rule, or capped Pro inventory policy.
 */
export const WELCOME_BUNDLE_CREDITS = 5;
export const STARTER_PLAN_CREDITS = 5;
export const PRO_ACTIVE_LISTING_LIMIT = 20;

export const AHC_PAID_OFFERS = {
  welcomeBundle: { amountXaf: 3_000, validityDays: 30, label: "New-Agent Welcome Bundle", listingCredits: WELCOME_BUNDLE_CREDITS, subscriptionTier: "access", priorityRanking: false },
  starterAccess: { amountXaf: 10_000, validityDays: 30, label: "Starter Access", listingCredits: STARTER_PLAN_CREDITS, subscriptionTier: "growth", priorityRanking: false },
  proAccess: { amountXaf: 25_000, validityDays: 30, label: "Pro Access", listingCredits: 0, subscriptionTier: "agency", priorityRanking: true, activeListingLimit: PRO_ACTIVE_LISTING_LIMIT },
  featuredPin: { amountXaf: 2_500, validityDays: 7, label: "Featured Landmark Pin", listingCredits: 0 },
  physicalVerificationRouteBatch: { amountXaf: 5_000, validityDays: 30, label: "Route-batch Physical Verification", listingCredits: 0 },
  physicalVerificationIndividual: { amountXaf: 7_500, validityDays: 30, label: "Individual Physical Verification", listingCredits: 0 },
  /** Historic orders remain reconcilable and receiptable during the commercial transition. */
  legacyAgentAccess: { amountXaf: 3_000, validityDays: 30, label: "Legacy Agent Access", listingCredits: 1, subscriptionTier: "access", priorityRanking: false },
  legacyListingPass: { amountXaf: 1_000, validityDays: 90, label: "Legacy Listing Pass", listingCredits: 1 },
  legacyPhysicalVerification: { amountXaf: 7_500, validityDays: 30, label: "Legacy Physical Verification", listingCredits: 0 },
} as const;

export type PaidOfferType =
  | "welcome_bundle"
  | "starter_access"
  | "pro_access"
  | "featured_pin"
  | "physical_verification_route_batch"
  | "physical_verification_individual"
  | "agent_access"
  | "listing_pass"
  | "physical_verification";

/** Owner-only operational events. They intentionally exclude rent, deposits, and tenancy payments. */
export const OWNER_ALERT_EVENT_TYPES = [
  "payment_confirmed",
  "payment_rejected",
  "verification_passed",
  "verification_failed",
  "safety_hold_applied",
  "safety_hold_released",
  "listing_published",
  "announcement",
  "staff_sign_in",
] as const;

export type OwnerAlertEventType = (typeof OWNER_ALERT_EVENT_TYPES)[number];

/** Only operational staff sign-ins are eligible for immediate owner alerts. */
export const OWNER_ALERT_STAFF_SIGN_IN_ROLES = ["agent", "moderator", "admin"] as const;
export type OwnerAlertStaffSignInRole = (typeof OWNER_ALERT_STAFF_SIGN_IN_ROLES)[number];

export function isOwnerAlertStaffSignInRole(role: string): role is OwnerAlertStaffSignInRole {
  return (OWNER_ALERT_STAFF_SIGN_IN_ROLES as readonly string[]).includes(role);
}

export const OWNER_ALERT_STATUSES = ["queued", "sent", "delivered", "read", "failed", "suppressed"] as const;
export type OwnerAlertStatus = (typeof OWNER_ALERT_STATUSES)[number];

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
    welcome_bundle: AHC_PAID_OFFERS.welcomeBundle,
    starter_access: AHC_PAID_OFFERS.starterAccess,
    pro_access: AHC_PAID_OFFERS.proAccess,
    featured_pin: AHC_PAID_OFFERS.featuredPin,
    physical_verification_route_batch: AHC_PAID_OFFERS.physicalVerificationRouteBatch,
    physical_verification_individual: AHC_PAID_OFFERS.physicalVerificationIndividual,
    agent_access: AHC_PAID_OFFERS.legacyAgentAccess,
    listing_pass: AHC_PAID_OFFERS.legacyListingPass,
    physical_verification: AHC_PAID_OFFERS.legacyPhysicalVerification,
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
