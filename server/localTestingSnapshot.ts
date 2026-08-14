import { timingSafeEqual } from "node:crypto";

type PublicListingForSnapshot = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  landmark: string;
  propertyType: string;
  bedrooms: number | null;
  householdFit: string | null;
  availableFrom: Date | string;
  lastReconfirmed: Date | string;
  map: { latitude: number; longitude: number; radiusM: number };
  featured: boolean;
  verificationStatus: string;
  photosCount: number;
  walkthrough: unknown;
  neighborhoodEssentials: unknown;
  trust: unknown;
  costs: {
    monthlyRent: number;
    advanceMonths: number;
    securityDeposit: number;
    agencyFee: number;
    serviceFee: number;
    firstMonthUtilities: number;
    totalMoveInCashRequired: number;
  };
};

/**
 * Constant-time Bearer-token comparison for the local-only testing export.
 * A missing token always disables the endpoint rather than falling back to an
 * unsafe default.
 */
export function isAuthorizedLocalTestingExport(authorization: string | undefined, configuredToken: string) {
  if (!configuredToken || configuredToken.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const receivedToken = authorization.slice("Bearer ".length);
  const expected = Buffer.from(configuredToken);
  const received = Buffer.from(receivedToken);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Removes every credential, payment, contact, exact-address, evidence, and
 * audit field. This payload is deliberately suitable only for marketplace UI
 * and ranking tests in a separate local MySQL database.
 */
export function buildSanitizedLocalTestingSnapshot(listings: PublicListingForSnapshot[]) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    classification: "sanitized-local-testing-only",
    listings: listings.map(listing => ({
      id: listing.id,
      title: listing.title,
      city: listing.city,
      neighborhood: listing.neighborhood,
      landmark: listing.landmark,
      propertyType: listing.propertyType,
      bedrooms: listing.bedrooms,
      householdFit: listing.householdFit,
      availableFrom: new Date(listing.availableFrom).toISOString(),
      lastReconfirmed: new Date(listing.lastReconfirmed).toISOString(),
      approximateMap: listing.map,
      featured: listing.featured,
      verificationStatus: listing.verificationStatus,
      photosCount: listing.photosCount,
      hasPublishedWalkthrough: Boolean(listing.walkthrough),
      neighborhoodEssentials: listing.neighborhoodEssentials,
      trust: listing.trust,
      costs: listing.costs,
    })),
  } as const;
}
