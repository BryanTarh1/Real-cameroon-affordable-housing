export const FRESHNESS_WINDOW_DAYS = 14;
export const APPROXIMATE_RADIUS_MIN_M = 200;
export const APPROXIMATE_RADIUS_MAX_M = 500;

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
