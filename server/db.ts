import { and, desc, eq, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  adminAuditEvents,
  agentProfiles,
  fieldVerificationCommissions,
  InsertUser,
  listingCosts,
  listingCredits,
  listingPromotions,
  listingReviewEvents,
  listings,
  moderatorProfiles,
  paymentOrders,
  platformSettings,
  reports,
  users,
  verificationEvents,
  verificationOrders,
} from "../drizzle/schema";
import { calculateFieldVerificationCommission, calculateTotalMoveInCash, DEFAULT_FIELD_MODERATOR_SHARE_BPS, FRESHNESS_WINDOW_DAYS, getAgentAccessState, getPaidOffer, type PaidOfferType } from "../shared/ahc";
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

const DEFAULT_PLATFORM_SETTINGS = { id: 1, agentAccessFeeXaf: 3_000, listingPassFeeXaf: 1_000, featuredPinFeeXaf: 3_000, physicalVerificationFeeXaf: 7_500, fieldModeratorShareBps: DEFAULT_FIELD_MODERATOR_SHARE_BPS };

export async function getPlatformSettings() {
  const db = await getDb();
  if (!db) return { ...DEFAULT_PLATFORM_SETTINGS, updatedAt: new Date(), updatedByUserId: null };
  const existing = (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1))[0];
  if (existing) return existing;
  await db.insert(platformSettings).values(DEFAULT_PLATFORM_SETTINGS);
  return (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1))[0]!;
}

export async function updatePlatformSettings(actorUserId: number, input: Omit<typeof DEFAULT_PLATFORM_SETTINGS, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.fieldModeratorShareBps < 0 || input.fieldModeratorShareBps > 10_000) throw new Error("Field Moderator share must be between 0 and 10,000 basis points.");
  await db.transaction(async (tx) => {
    await tx.insert(platformSettings).values({ id: 1, ...input, updatedByUserId: actorUserId }).onDuplicateKeyUpdate({ set: { ...input, updatedByUserId: actorUserId } });
    await tx.insert(adminAuditEvents).values({ action: "settings_updated", actorUserId, details: JSON.stringify(input) });
  });
  return getPlatformSettings();
}

export async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isBanned: users.isBanned, bannedAt: users.bannedAt, banReason: users.banReason, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn));
}

export async function setUserBan(actorUserId: number, targetUserId: number, isBanned: boolean, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (actorUserId === targetUserId) throw new Error("Administrators cannot change their own access state.");
  const target = (await db.select({ id: users.id, openId: users.openId, role: users.role }).from(users).where(eq(users.id, targetUserId)).limit(1))[0];
  if (!target) throw new Error("User not found.");
  if (target.openId === ENV.ownerOpenId || target.role === "admin") throw new Error("Platform administrators cannot be banned from this workspace.");
  await db.transaction(async (tx) => {
    await tx.update(users).set({ isBanned, bannedAt: isBanned ? new Date() : null, bannedByUserId: isBanned ? actorUserId : null, banReason: isBanned ? reason : null }).where(eq(users.id, targetUserId));
    await tx.insert(adminAuditEvents).values({ action: isBanned ? "user_banned" : "user_unbanned", actorUserId, targetUserId, details: reason });
  });
  return { success: true };
}

export async function getAdminCashFlowAudit() {
  const db = await getDb();
  if (!db) return { confirmedRevenueXaf: 0, physicalVerificationRevenueXaf: 0, platformCommissionAccruedXaf: 0, fieldModeratorCommissionAccruedXaf: 0, orders: [] as Array<{ type: string; amountXaf: number }> };
  const orders = await db.select({ type: paymentOrders.type, amountXaf: paymentOrders.amountXaf }).from(paymentOrders).where(eq(paymentOrders.status, "confirmed"));
  const commissions = await db.select({ fieldModeratorAmountXaf: fieldVerificationCommissions.fieldModeratorAmountXaf, platformAmountXaf: fieldVerificationCommissions.platformAmountXaf }).from(fieldVerificationCommissions);
  return { confirmedRevenueXaf: orders.reduce((sum, order) => sum + order.amountXaf, 0), physicalVerificationRevenueXaf: orders.filter(order => order.type === "physical_verification").reduce((sum, order) => sum + order.amountXaf, 0), platformCommissionAccruedXaf: commissions.reduce((sum, item) => sum + item.platformAmountXaf, 0), fieldModeratorCommissionAccruedXaf: commissions.reduce((sum, item) => sum + item.fieldModeratorAmountXaf, 0), orders };
}

export async function listFieldModeratorCommissions(moderatorUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: fieldVerificationCommissions.id,
    verificationOrderId: fieldVerificationCommissions.verificationOrderId,
    grossAmountXaf: fieldVerificationCommissions.grossAmountXaf,
    fieldModeratorAmountXaf: fieldVerificationCommissions.fieldModeratorAmountXaf,
    platformAmountXaf: fieldVerificationCommissions.platformAmountXaf,
    fieldModeratorShareBps: fieldVerificationCommissions.fieldModeratorShareBps,
    status: fieldVerificationCommissions.status,
    paidAt: fieldVerificationCommissions.paidAt,
    createdAt: fieldVerificationCommissions.createdAt,
    listingId: verificationOrders.listingId,
  }).from(fieldVerificationCommissions).innerJoin(verificationOrders, eq(fieldVerificationCommissions.verificationOrderId, verificationOrders.id)).where(eq(fieldVerificationCommissions.moderatorUserId, moderatorUserId)).orderBy(desc(fieldVerificationCommissions.createdAt));
}

export async function listAdminCommissionLedger() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: fieldVerificationCommissions.id,
    verificationOrderId: fieldVerificationCommissions.verificationOrderId,
    moderatorUserId: fieldVerificationCommissions.moderatorUserId,
    moderatorName: users.name,
    listingId: verificationOrders.listingId,
    grossAmountXaf: fieldVerificationCommissions.grossAmountXaf,
    fieldModeratorAmountXaf: fieldVerificationCommissions.fieldModeratorAmountXaf,
    platformAmountXaf: fieldVerificationCommissions.platformAmountXaf,
    fieldModeratorShareBps: fieldVerificationCommissions.fieldModeratorShareBps,
    status: fieldVerificationCommissions.status,
    paidAt: fieldVerificationCommissions.paidAt,
    createdAt: fieldVerificationCommissions.createdAt,
  }).from(fieldVerificationCommissions).innerJoin(verificationOrders, eq(fieldVerificationCommissions.verificationOrderId, verificationOrders.id)).innerJoin(users, eq(fieldVerificationCommissions.moderatorUserId, users.id)).orderBy(desc(fieldVerificationCommissions.createdAt));
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
    const agent = (await tx.select().from(agentProfiles).where(eq(agentProfiles.userId, input.agentUserId)).limit(1))[0];
    const now = new Date();
    const access = agent && getAgentAccessState(agent.subscriptionStatus, agent.subscriptionExpiresAt, now);
    if (!access?.active) {
      if (access?.shouldMarkExpired) {
        await tx.update(agentProfiles).set({ subscriptionStatus: "expired" })
          .where(eq(agentProfiles.userId, input.agentUserId));
      }
      throw new Error("Renew Agent Access before submitting new listings or reconfirming availability.");
    }
    const credit = (await tx.select().from(listingCredits).where(and(
      eq(listingCredits.userId, input.agentUserId),
      sql`${listingCredits.status} IN ('available', 'restored')`,
      sql`(${listingCredits.expiresAt} IS NULL OR ${listingCredits.expiresAt} >= ${now})`,
    )).orderBy(listingCredits.createdAt).limit(1))[0];
    if (!credit) throw new Error("Purchase and reconcile a Listing Pass before submitting a new listing.");
    await tx.insert(listings).values({
      id, title: input.title, city: input.city, neighborhood: input.neighborhood, landmark: input.landmark,
      propertyType: input.propertyType, householdFit: input.householdFit ?? null, availableFrom: new Date(input.availableFrom),
      status: "under_review", agentUserId: input.agentUserId, agentNameSnapshot: input.agentNameSnapshot,
      publicLatitude: String(input.publicLatitude), publicLongitude: String(input.publicLongitude), mapRadiusM: input.mapRadiusM,
    });
    await tx.insert(listingCosts).values({ listingId: id, ...input.costs });
    await tx.update(listingCredits).set({ status: "consumed", usedForListingId: id, consumedAt: now })
      .where(eq(listingCredits.id, credit.id));
    await tx.insert(listingReviewEvents).values({
      listingId: id, action: "submitted", toStatus: "under_review", actorUserId: input.agentUserId,
      reason: "Paid listing credit consumed; ready for moderator review.",
    });
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
  return db.transaction(async (tx) => {
    const now = new Date();
    const agent = (await tx.select().from(agentProfiles).where(eq(agentProfiles.userId, userId)).limit(1))[0];
    const access = agent && getAgentAccessState(agent.subscriptionStatus, agent.subscriptionExpiresAt, now);
    if (!access?.active) {
      if (access?.shouldMarkExpired) {
        await tx.update(agentProfiles).set({ subscriptionStatus: "expired" }).where(eq(agentProfiles.userId, userId));
      }
      throw new Error("Renew Agent Access before submitting new listings or reconfirming availability.");
    }
    const result = await tx.update(listings).set({
      status: sql`CASE WHEN ${listings.status} = 'needs_reconfirmation' THEN 'published' ELSE ${listings.status} END`,
      lastReconfirmed: now, freshnessWindowDays: FRESHNESS_WINDOW_DAYS,
    })
      .where(and(eq(listings.id, listingId), eq(listings.agentUserId, userId), sql`${listings.status} IN ('published', 'needs_reconfirmation')`));
    if (!result[0].affectedRows) throw new Error("Listing not found or you do not manage it");
    return { success: true };
  });
}

export async function createPromotionRequest(userId: number, listingId: string) {
  return createPaymentOrder(userId, "featured_pin", listingId);
}

export async function createListingReport(listingId: string, note: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(reports).values({ listingId, note });
  return { success: true };
}

export async function createPaymentOrder(userId: number, type: PaidOfferType, listingId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const offer = getPaidOffer(type);
  const settings = await getPlatformSettings();
  const amountByType = {
    agent_access: settings.agentAccessFeeXaf,
    listing_pass: settings.listingPassFeeXaf,
    featured_pin: settings.featuredPinFeeXaf,
    physical_verification: settings.physicalVerificationFeeXaf,
  } as const;
  const amountXaf = amountByType[type];

  if (listingId) {
    const ownedListing = (await db.select({ id: listings.id, status: listings.status }).from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.agentUserId, userId))).limit(1))[0];
    if (!ownedListing) throw new Error("Listing not found or you do not manage it.");
    if (type === "featured_pin" && ownedListing.status !== "published") {
      throw new Error("A Featured Landmark Pin can only be requested for a published listing.");
    }
  }

  const id = `PAY-${nanoid(12).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await db.insert(paymentOrders).values({ id, userId, listingId: listingId ?? null, type, amountXaf, expiresAt });
  return { id, amountXaf, type, expiresAt };
}

export async function submitPaymentReference(userId: number, orderId: string, provider: "mtn_momo" | "orange_money" | "other", reference: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(paymentOrders).set({
    provider, providerReference: reference, status: "reference_submitted", submittedAt: new Date(),
  }).where(and(
    eq(paymentOrders.id, orderId), eq(paymentOrders.userId, userId), eq(paymentOrders.status, "awaiting_reference"),
    sql`(${paymentOrders.expiresAt} IS NULL OR ${paymentOrders.expiresAt} >= NOW())`,
  ));
  if (!result[0].affectedRows) throw new Error("This order cannot accept a payment reference. Check its status or create a new order.");
  return { success: true };
}

export async function listAgentPaymentOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: paymentOrders.id, listingId: paymentOrders.listingId, type: paymentOrders.type, status: paymentOrders.status,
    amountXaf: paymentOrders.amountXaf, provider: paymentOrders.provider, providerReference: paymentOrders.providerReference,
    createdAt: paymentOrders.createdAt, expiresAt: paymentOrders.expiresAt, reconciliationNote: paymentOrders.reconciliationNote,
  }).from(paymentOrders).where(eq(paymentOrders.userId, userId)).orderBy(desc(paymentOrders.createdAt));
}

export async function getAgentPaidStatus(userId: number) {
  const db = await getDb();
  if (!db) return { profile: undefined, availableCredits: 0 };
  const profile = await getAgentProfile(userId);
  const access = profile && getAgentAccessState(profile.subscriptionStatus, profile.subscriptionExpiresAt);
  if (access?.shouldMarkExpired) {
    await db.update(agentProfiles).set({ subscriptionStatus: "expired" })
      .where(eq(agentProfiles.userId, userId));
  }
  const effectiveProfile = access?.shouldMarkExpired ? { ...profile!, subscriptionStatus: "expired" as const } : profile;
  const creditRows = await db.select({ id: listingCredits.id }).from(listingCredits).where(and(
    eq(listingCredits.userId, userId), sql`${listingCredits.status} IN ('available', 'restored')`,
    sql`(${listingCredits.expiresAt} IS NULL OR ${listingCredits.expiresAt} >= NOW())`,
  ));
  return {
    profile: effectiveProfile,
    availableCredits: creditRows.length,
    access: access ?? { active: false, daysRemaining: 0, renewalRecommended: false, shouldMarkExpired: false, suspensionReason: "Renew Agent Access before submitting new listings or reconfirming availability." },
  };
}

export async function listOperationsPaymentQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: paymentOrders.id, userId: paymentOrders.userId, listingId: paymentOrders.listingId, type: paymentOrders.type,
    status: paymentOrders.status, amountXaf: paymentOrders.amountXaf, provider: paymentOrders.provider,
    providerReference: paymentOrders.providerReference, submittedAt: paymentOrders.submittedAt, createdAt: paymentOrders.createdAt,
    agentName: agentProfiles.publicName, agencyName: agentProfiles.agencyName,
  }).from(paymentOrders).leftJoin(agentProfiles, eq(agentProfiles.userId, paymentOrders.userId))
    .where(eq(paymentOrders.status, "reference_submitted")).orderBy(paymentOrders.submittedAt);
}

export async function reconcilePaymentOrder(operatorUserId: number, orderId: string, decision: "confirmed" | "rejected", note: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const order = (await tx.select().from(paymentOrders).where(eq(paymentOrders.id, orderId)).limit(1))[0];
    if (!order || order.status !== "reference_submitted") throw new Error("Only submitted payment references can be reconciled.");
    const now = new Date();
    await tx.update(paymentOrders).set({
      status: decision, reconciledAt: now, reconciledByUserId: operatorUserId, reconciliationNote: note,
    }).where(eq(paymentOrders.id, orderId));
    if (decision === "rejected") return { status: "rejected" as const };

    const offer = getPaidOffer(order.type);
    const expiresAt = new Date(now.getTime() + offer.validityDays * 24 * 60 * 60 * 1000);
    if (order.type === "agent_access") {
      await tx.update(agentProfiles).set({ subscriptionStatus: "active", subscriptionExpiresAt: expiresAt })
        .where(eq(agentProfiles.userId, order.userId));
      await tx.insert(listingCredits).values({ userId: order.userId, paymentOrderId: order.id, expiresAt });
    }
    if (order.type === "listing_pass") {
      await tx.insert(listingCredits).values({ userId: order.userId, paymentOrderId: order.id, expiresAt });
    }
    if (order.type === "featured_pin" && order.listingId) {
      await tx.insert(listingPromotions).values({
        listingId: order.listingId, amountXaf: order.amountXaf, status: "active", startsAt: now, endsAt: expiresAt,
        providerReference: order.providerReference,
      });
      await tx.update(listings).set({ isFeatured: true, featuredUntil: expiresAt }).where(eq(listings.id, order.listingId));
    }
    if (order.type === "physical_verification" && order.listingId) {
      await tx.insert(verificationOrders).values({
        listingId: order.listingId, requestedByUserId: order.userId, status: "paid", amountXaf: order.amountXaf,
        providerReference: order.providerReference,
      });
    }
    return { status: "confirmed" as const };
  });
}

export async function listOperationsReviewQueue() {
  const db = await getDb();
  if (!db) return [];
  const queue = await db.select({
    id: listings.id, title: listings.title, city: listings.city, neighborhood: listings.neighborhood, landmark: listings.landmark,
    propertyType: listings.propertyType, status: listings.status, agentUserId: listings.agentUserId, agentName: listings.agentNameSnapshot,
    submittedAt: listings.submittedAt, lastReconfirmed: listings.lastReconfirmed, verificationStatus: listings.verificationStatus,
    monthlyRent: listingCosts.monthlyRent, advanceMonths: listingCosts.advanceMonths, securityDeposit: listingCosts.securityDeposit,
    agencyFee: listingCosts.agencyFee, serviceFee: listingCosts.serviceFee, firstMonthUtilities: listingCosts.firstMonthUtilities,
  }).from(listings).innerJoin(listingCosts, eq(listingCosts.listingId, listings.id))
    .where(sql`${listings.status} IN ('under_review', 'changes_requested')`).orderBy(listings.submittedAt);
  const events = await db.select().from(listingReviewEvents).orderBy(desc(listingReviewEvents.createdAt));
  return queue.map((item) => {
    const latestAssignment = events.find(event => event.listingId === item.id && event.action === "assigned");
    return {
      ...item,
      assignedModeratorUserId: latestAssignment?.assignedModeratorUserId ?? null,
      costs: {
        monthlyRent: item.monthlyRent, advanceMonths: item.advanceMonths, securityDeposit: item.securityDeposit,
        agencyFee: item.agencyFee, serviceFee: item.serviceFee, firstMonthUtilities: item.firstMonthUtilities,
        totalMoveInCashRequired: calculateTotalMoveInCash(item),
      },
    };
  });
}

export async function listOperationsVerificationQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: verificationOrders.id, listingId: verificationOrders.listingId, status: verificationOrders.status,
    amountXaf: verificationOrders.amountXaf, createdAt: verificationOrders.createdAt,
    assignedModeratorUserId: verificationOrders.assignedModeratorUserId, evidenceNote: verificationOrders.evidenceNote,
    title: listings.title, city: listings.city, neighborhood: listings.neighborhood, landmark: listings.landmark,
    agentName: agentProfiles.publicName,
  }).from(verificationOrders)
    .innerJoin(listings, eq(listings.id, verificationOrders.listingId))
    .leftJoin(agentProfiles, eq(agentProfiles.userId, verificationOrders.requestedByUserId))
    .where(sql`${verificationOrders.status} IN ('paid', 'scheduled')`)
    .orderBy(verificationOrders.createdAt);
}

export async function claimVerificationOrder(operatorUserId: number, verificationOrderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const order = (await tx.select().from(verificationOrders).where(eq(verificationOrders.id, verificationOrderId)).limit(1))[0];
    if (!order || !["paid", "scheduled"].includes(order.status)) throw new Error("This verification request is not awaiting field review.");
    if (order.assignedModeratorUserId && order.assignedModeratorUserId !== operatorUserId) throw new Error("This verification request is already assigned to another reviewer.");
    const target = "scheduled" as const;
    await tx.update(verificationOrders).set({ assignedModeratorUserId: operatorUserId, status: target }).where(eq(verificationOrders.id, verificationOrderId));
    await tx.insert(verificationEvents).values({
      verificationOrderId, listingId: order.listingId, action: "assigned", fromStatus: order.status, toStatus: target,
      reason: "Physical verification claimed for field review.", actorUserId: operatorUserId, assignedModeratorUserId: operatorUserId,
    });
    return { success: true };
  });
}

export async function decideVerificationOrder(operatorUserId: number, verificationOrderId: number, decision: "passed" | "failed", evidenceNote: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const order = (await tx.select().from(verificationOrders).where(eq(verificationOrders.id, verificationOrderId)).limit(1))[0];
    if (!order || order.status !== "scheduled") throw new Error("Only claimed verification requests can receive a field outcome.");
    if (order.assignedModeratorUserId !== operatorUserId) throw new Error("Only the assigned reviewer can record this verification outcome.");
    const now = new Date();
    const expiresAt = decision === "passed" ? new Date(now.getTime() + getPaidOffer("physical_verification").validityDays * 86_400_000) : null;
    await tx.update(verificationOrders).set({ status: decision, evidenceNote, verifiedAt: now, expiresAt }).where(eq(verificationOrders.id, verificationOrderId));
    await tx.update(listings).set({
      verificationStatus: decision === "passed" ? "physical_verified" : "unverified",
      verificationExpiresAt: expiresAt,
    }).where(eq(listings.id, order.listingId));
    await tx.insert(verificationEvents).values({
      verificationOrderId, listingId: order.listingId, action: decision, fromStatus: order.status, toStatus: decision,
      reason: evidenceNote, actorUserId: operatorUserId, assignedModeratorUserId: operatorUserId,
    });
    if (decision === "passed") {
      const settings = await getPlatformSettings();
      const allocation = calculateFieldVerificationCommission(order.amountXaf, settings.fieldModeratorShareBps);
      await tx.insert(fieldVerificationCommissions).values({ verificationOrderId, moderatorUserId: operatorUserId, ...allocation });
    }
    return { status: decision, expiresAt };
  });
}

export async function assignListingReview(operatorUserId: number, listingId: string, moderatorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const listing = (await db.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  if (!listing || !["under_review", "changes_requested"].includes(listing.status)) throw new Error("This listing is not awaiting review.");
  if (moderatorUserId !== operatorUserId) throw new Error("Reviewers may only claim assignments for themselves.");
  if (listing.agentUserId === moderatorUserId) throw new Error("A reviewer cannot be assigned to their own listing.");
  await db.insert(listingReviewEvents).values({
    listingId, action: "assigned", fromStatus: listing.status, toStatus: listing.status,
    actorUserId: operatorUserId, assignedModeratorUserId: moderatorUserId, reason: "Review assignment recorded.",
  });
  return { success: true };
}

export async function decideListingReview(operatorUserId: number, listingId: string, decision: "approved" | "changes_requested" | "rejected", reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const listing = (await tx.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
    if (!listing || !["under_review", "changes_requested"].includes(listing.status)) throw new Error("This listing is not awaiting a review decision.");
    if (listing.agentUserId === operatorUserId) throw new Error("A reviewer cannot decide their own listing.");
    const now = new Date();
    const target = decision === "approved" ? "published" : decision;
    await tx.update(listings).set({
      status: target, reviewedAt: now, reviewedByUserId: operatorUserId, reviewSummary: reason,
      approvedAt: decision === "approved" ? now : null,
      ...(decision === "approved" ? { lastReconfirmed: now, freshnessWindowDays: FRESHNESS_WINDOW_DAYS } : {}),
    }).where(eq(listings.id, listingId));
    await tx.insert(listingReviewEvents).values({
      listingId, action: decision, fromStatus: listing.status, toStatus: target, reason, actorUserId: operatorUserId,
    });
    if (decision === "rejected") {
      await tx.update(listingCredits).set({ status: "restored", usedForListingId: null, consumedAt: null })
        .where(and(eq(listingCredits.usedForListingId, listingId), eq(listingCredits.status, "consumed")));
    }
    return { status: target };
  });
}

export async function listReviewHistory(listingId: string, agentUserId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (agentUserId) {
    const owned = (await db.select({ id: listings.id }).from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.agentUserId, agentUserId))).limit(1))[0];
    if (!owned) throw new Error("Listing not found or you do not manage it.");
  }
  return db.select().from(listingReviewEvents).where(eq(listingReviewEvents.listingId, listingId)).orderBy(desc(listingReviewEvents.createdAt));
}
