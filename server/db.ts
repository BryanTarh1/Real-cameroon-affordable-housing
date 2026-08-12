import { and, desc, eq, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  agentProfiles,
  InsertUser,
  listingCosts,
  listingPromotions,
  listings,
  reports,
  users,
} from "../drizzle/schema";
import { calculateTotalMoveInCash, FRESHNESS_WINDOW_DAYS } from "../shared/ahc";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

/** Idempotent archival guard. The public read path invokes this as a safety net. */
export async function archiveStaleListings(now = new Date()) {
  const db = await getDb();
  if (!db) return { archived: 0 };
  const cutoff = new Date(now.getTime() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const result = await db.update(listings)
    .set({ status: "archived" })
    .where(and(eq(listings.status, "published"), lt(listings.lastReconfirmed, cutoff)));
  return { archived: result[0].affectedRows ?? 0 };
}

export type PublicListingFilters = {
  city?: string;
  search?: string;
  maxMonthlyRent?: number;
  maxMoveInCash?: number;
  verification?: "any" | "physical_verified";
};

function mapListing(row: any) {
  const costs = {
    monthlyRent: Number(row.monthlyRent),
    advanceMonths: Number(row.advanceMonths),
    securityDeposit: Number(row.securityDeposit),
    agencyFee: Number(row.agencyFee),
    serviceFee: Number(row.serviceFee),
    firstMonthUtilities: Number(row.firstMonthUtilities),
  };
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    neighborhood: row.neighborhood,
    landmark: row.landmark,
    propertyType: row.propertyType,
    householdFit: row.householdFit,
    availableFrom: row.availableFrom,
    lastReconfirmed: row.lastReconfirmed,
    map: { latitude: Number(row.publicLatitude), longitude: Number(row.publicLongitude), radiusM: row.mapRadiusM },
    featured: Boolean(row.isFeatured) && (!row.featuredUntil || new Date(row.featuredUntil) > new Date()),
    verificationStatus: row.verificationStatus,
    photosCount: row.photosCount,
    agent: { name: row.publicName ?? row.agentNameSnapshot, whatsappPhone: row.whatsappPhone ?? null },
    costs: { ...costs, totalMoveInCashRequired: calculateTotalMoveInCash(costs) },
  };
}

export async function listFreshPublicListings(filters: PublicListingFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  await archiveStaleListings();
  const cutoff = new Date(Date.now() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    id: listings.id, title: listings.title, city: listings.city, neighborhood: listings.neighborhood,
    landmark: listings.landmark, propertyType: listings.propertyType, householdFit: listings.householdFit,
    availableFrom: listings.availableFrom, lastReconfirmed: listings.lastReconfirmed,
    publicLatitude: listings.publicLatitude, publicLongitude: listings.publicLongitude, mapRadiusM: listings.mapRadiusM,
    isFeatured: listings.isFeatured, featuredUntil: listings.featuredUntil, verificationStatus: listings.verificationStatus,
    photosCount: listings.photosCount, agentNameSnapshot: listings.agentNameSnapshot,
    monthlyRent: listingCosts.monthlyRent, advanceMonths: listingCosts.advanceMonths,
    securityDeposit: listingCosts.securityDeposit, agencyFee: listingCosts.agencyFee,
    serviceFee: listingCosts.serviceFee, firstMonthUtilities: listingCosts.firstMonthUtilities,
    publicName: agentProfiles.publicName, whatsappPhone: agentProfiles.whatsappPhone,
  }).from(listings)
    .innerJoin(listingCosts, eq(listingCosts.listingId, listings.id))
    .leftJoin(agentProfiles, eq(agentProfiles.userId, listings.agentUserId))
    .where(and(eq(listings.status, "published"), sql`${listings.lastReconfirmed} >= ${cutoff}`))
    .orderBy(desc(listings.isFeatured), desc(listings.lastReconfirmed));

  const needle = filters.search?.trim().toLowerCase();
  return rows.map(mapListing).filter((listing) => {
    if (filters.city && filters.city !== "All cities" && listing.city !== filters.city) return false;
    if (filters.maxMonthlyRent && listing.costs.monthlyRent > filters.maxMonthlyRent) return false;
    if (filters.maxMoveInCash && listing.costs.totalMoveInCashRequired > filters.maxMoveInCash) return false;
    if (filters.verification === "physical_verified" && listing.verificationStatus !== "physical_verified") return false;
    if (needle && !`${listing.title} ${listing.city} ${listing.neighborhood} ${listing.landmark} ${listing.propertyType}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

export async function getPublicListingContact(listingId: string) {
  const items = await listFreshPublicListings();
  return items.find((item) => item.id === listingId) ?? null;
}

export async function getAgentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId)).limit(1))[0];
}

export async function upsertAgentProfile(input: {
  userId: number; publicName: string; agencyName?: string; whatsappPhone: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(agentProfiles).values(input).onDuplicateKeyUpdate({
    set: { publicName: input.publicName, agencyName: input.agencyName ?? null, whatsappPhone: input.whatsappPhone },
  });
  return getAgentProfile(input.userId);
}

export type CreateListingInput = {
  agentUserId: number;
  agentNameSnapshot: string;
  title: string; city: string; neighborhood: string; landmark: string; propertyType: string;
  householdFit?: string; availableFrom: string; publicLatitude: number; publicLongitude: number; mapRadiusM: number;
  costs: { monthlyRent: number; advanceMonths: number; securityDeposit: number; agencyFee: number; serviceFee: number; firstMonthUtilities: number };
};

export async function createListing(input: CreateListingInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const id = `AHC-${nanoid(10).toUpperCase()}`;
  await db.transaction(async (tx) => {
    await tx.insert(listings).values({
      id, title: input.title, city: input.city, neighborhood: input.neighborhood, landmark: input.landmark,
      propertyType: input.propertyType, householdFit: input.householdFit ?? null, availableFrom: new Date(input.availableFrom),
      status: "under_review", agentUserId: input.agentUserId, agentNameSnapshot: input.agentNameSnapshot,
      publicLatitude: String(input.publicLatitude), publicLongitude: String(input.publicLongitude), mapRadiusM: input.mapRadiusM,
    });
    await tx.insert(listingCosts).values({ listingId: id, ...input.costs });
  });
  return id;
}

export async function listAgentListings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: listings.id, title: listings.title, city: listings.city, neighborhood: listings.neighborhood,
    status: listings.status, lastReconfirmed: listings.lastReconfirmed, verificationStatus: listings.verificationStatus,
    isFeatured: listings.isFeatured, featuredUntil: listings.featuredUntil, monthlyRent: listingCosts.monthlyRent,
    advanceMonths: listingCosts.advanceMonths, securityDeposit: listingCosts.securityDeposit, agencyFee: listingCosts.agencyFee,
    serviceFee: listingCosts.serviceFee, firstMonthUtilities: listingCosts.firstMonthUtilities,
  }).from(listings).innerJoin(listingCosts, eq(listingCosts.listingId, listings.id))
    .where(eq(listings.agentUserId, userId)).orderBy(desc(listings.createdAt));
  return rows.map((row) => ({ ...row, costs: {
    monthlyRent: row.monthlyRent, advanceMonths: row.advanceMonths, securityDeposit: row.securityDeposit,
    agencyFee: row.agencyFee, serviceFee: row.serviceFee, firstMonthUtilities: row.firstMonthUtilities,
    totalMoveInCashRequired: calculateTotalMoveInCash(row),
  }}));
}

export async function reconfirmAgentListing(userId: number, listingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(listings).set({ status: "published", lastReconfirmed: new Date(), freshnessWindowDays: FRESHNESS_WINDOW_DAYS })
    .where(and(eq(listings.id, listingId), eq(listings.agentUserId, userId)));
  if (!result[0].affectedRows) throw new Error("Listing not found or you do not manage it");
  return { success: true };
}

export async function createPromotionRequest(userId: number, listingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ownListing = (await db.select({ id: listings.id }).from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.agentUserId, userId))).limit(1))[0];
  if (!ownListing) throw new Error("Listing not found or you do not manage it");
  await db.insert(listingPromotions).values({ listingId, amountXaf: 3_000, status: "pending" });
  return { success: true, amountXaf: 3_000 };
}

export async function createListingReport(listingId: string, note: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(reports).values({ listingId, note });
  return { success: true };
}
