import { and, desc, eq, isNotNull, lt, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  adminAuditEvents,
  agentProfiles,
  fieldVerificationCommissions,
  InsertUser,
  listingCosts,
  listingCredits,
  listingNeighborhoodAssessments,
  leadEvents,
  listingPromotions,
  listingReviewEvents,
  listingWalkthroughVideos,
  listings,
  localCredentials,
  moderatorProfiles,
  onboardingApplications,
  paymentOrders,
  platformSettings,
  reports,
  seekerMatchAlertPreferences,
  matchAlertDeliveries,
  ownerAlertOutbox,
  users,
  verificationEvents,
  verificationEvidence,
  verificationAudits,
  verificationOrders,
  viewingAppointmentEvents,
  viewingAppointments,
} from "../drizzle/schema";
import { calculateFieldVerificationCommission, calculateTotalMoveInCash, createWhatsAppListingLink, DEFAULT_FIELD_MODERATOR_SHARE_BPS, FRESHNESS_WINDOW_DAYS, getAgentAccessState, getPaidOffer, PRO_ACTIVE_LISTING_LIMIT, type OwnerAlertEventType, type OwnerAlertStatus, type PaidOfferType } from "../shared/ahc";
import { ENV } from "./_core/env";
import { buildOwnerAlertTemplatePayload, getOwnerAlertDashboardUrl, META_WHATSAPP_GRAPH_VERSION } from "./ownerAlerts";
import { summarizeAdminLeadEvents } from "./leadCounts";

let _db: ReturnType<typeof drizzle> | null = null;

const OWNER_ALERT_UNCONFIGURED_REASON = "WhatsApp provider is not configured; this operational alert remains queued.";

function isOwnerAlertProviderConfigured() {
  return Boolean(
    ENV.whatsappPhoneNumberId
      && ENV.whatsappAccessToken
      && ENV.whatsappOwnerPhone
      && ENV.whatsappTemplateName,
  );
}

function maskOwnerPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "Not configured";
}

/** Safe, Admin-readable configuration state; no credential or full phone number leaves the server. */
export async function getOwnerAlertProviderStatus() {
  const settings = await getPlatformSettings();
  return {
    configured: isOwnerAlertProviderConfigured(),
    enabled: settings.ownerAlertsEnabled,
    active: isOwnerAlertProviderConfigured() && settings.ownerAlertsEnabled,
    provider: isOwnerAlertProviderConfigured() ? "Meta WhatsApp Cloud API" : "Not configured",
    ownerPhoneMasked: ENV.whatsappOwnerPhone ? maskOwnerPhone(ENV.whatsappOwnerPhone) : "Not configured",
    templateName: ENV.whatsappTemplateName || null,
    queuePolicy: OWNER_ALERT_UNCONFIGURED_REASON,
  };
}

/** Inserts one alert per durable business event/reference pair and returns its existing row on replay. */
export async function enqueueOwnerAlert(eventType: OwnerAlertEventType, referenceId: string, summary: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const dedupeKey = `${eventType}:${referenceId}`;
  await db.insert(ownerAlertOutbox).values({
    eventType,
    referenceId,
    summary: summary.slice(0, 500),
    dedupeKey,
    provider: isOwnerAlertProviderConfigured() ? "meta_whatsapp_cloud" : "unconfigured",
  }).onDuplicateKeyUpdate({ set: { dedupeKey: sql`${ownerAlertOutbox.dedupeKey}` } });
  const alert = (await db.select().from(ownerAlertOutbox).where(eq(ownerAlertOutbox.dedupeKey, dedupeKey)).limit(1))[0];
  if (!alert) throw new Error("Owner alert could not be queued.");
  return alert;
}

/** Sends a queued alert once. Delivery errors never roll back the confirmed platform event that caused it. */
export async function dispatchOwnerAlert(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const alert = (await db.select().from(ownerAlertOutbox).where(eq(ownerAlertOutbox.id, alertId)).limit(1))[0];
  if (!alert) throw new Error("Owner alert not found.");
  if (alert.providerMessageId || ["delivered", "read"].includes(alert.status)) return alert;
  const settings = await getPlatformSettings();
  if (!settings.ownerAlertsEnabled) {
    await db.update(ownerAlertOutbox).set({ provider: "disabled", status: "suppressed", failureReason: "Owner alerts are paused by an AHC administrator." })
      .where(eq(ownerAlertOutbox.id, alertId));
    return (await db.select().from(ownerAlertOutbox).where(eq(ownerAlertOutbox.id, alertId)).limit(1))[0];
  }
  if (!isOwnerAlertProviderConfigured()) {
    await db.update(ownerAlertOutbox).set({ provider: "unconfigured", status: "queued", failureReason: OWNER_ALERT_UNCONFIGURED_REASON })
      .where(eq(ownerAlertOutbox.id, alertId));
    return (await db.select().from(ownerAlertOutbox).where(eq(ownerAlertOutbox.id, alertId)).limit(1))[0];
  }
  const now = new Date();
  await db.update(ownerAlertOutbox).set({ provider: "meta_whatsapp_cloud", attemptCount: alert.attemptCount + 1, failureReason: null })
    .where(eq(ownerAlertOutbox.id, alertId));
  try {
    const response = await fetch(`https://graph.facebook.com/${META_WHATSAPP_GRAPH_VERSION}/${ENV.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.whatsappAccessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildOwnerAlertTemplatePayload({
        ownerPhone: ENV.whatsappOwnerPhone,
        templateName: ENV.whatsappTemplateName,
        language: ENV.whatsappTemplateLanguage,
        eventType: alert.eventType,
        referenceId: alert.referenceId,
        dashboardUrl: getOwnerAlertDashboardUrl(ENV.publicAppUrl),
      })),
      signal: AbortSignal.timeout(12_000),
    });
    const body = await response.json().catch(() => null) as { messages?: Array<{ id?: string }>; error?: { message?: string } } | null;
    const providerMessageId = body?.messages?.[0]?.id;
    if (!response.ok || !providerMessageId) {
      const failureReason = body?.error?.message?.slice(0, 900) || `Meta WhatsApp request failed with HTTP ${response.status}.`;
      await db.update(ownerAlertOutbox).set({ status: "failed", failedAt: now, failureReason })
        .where(eq(ownerAlertOutbox.id, alertId));
    } else {
      await db.update(ownerAlertOutbox).set({ status: "sent", providerMessageId, sentAt: now, failureReason: null })
        .where(eq(ownerAlertOutbox.id, alertId));
    }
  } catch (error) {
    await db.update(ownerAlertOutbox).set({
      status: "failed", failedAt: now,
      failureReason: (error instanceof Error ? error.message : "Meta WhatsApp dispatch failed.").slice(0, 900),
    }).where(eq(ownerAlertOutbox.id, alertId));
  }
  return (await db.select().from(ownerAlertOutbox).where(eq(ownerAlertOutbox.id, alertId)).limit(1))[0];
}

/** Records Meta delivery callbacks idempotently and never dispatches a new message. */
export async function updateOwnerAlertStatus(providerMessageId: string, status: OwnerAlertStatus, failureReason: string | null = null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const alert = (await db.select().from(ownerAlertOutbox).where(eq(ownerAlertOutbox.providerMessageId, providerMessageId)).limit(1))[0];
  if (!alert) return { updated: false, reason: "unknown_message" as const };
  const ranks: Record<OwnerAlertStatus, number> = { queued: 0, sent: 1, failed: 1, delivered: 2, read: 3, suppressed: 4 };
  if (ranks[status] < ranks[alert.status]) return { updated: false, reason: "stale_status" as const };
  const now = new Date();
  await db.update(ownerAlertOutbox).set({
    status,
    ...(status === "delivered" ? { deliveredAt: now } : {}),
    ...(status === "read" ? { readAt: now } : {}),
    ...(status === "failed" ? { failedAt: now, failureReason: failureReason ?? "Meta reported delivery failure." } : {}),
  }).where(eq(ownerAlertOutbox.id, alert.id));
  return { updated: true, reason: "recorded" as const };
}

export async function listOwnerAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ownerAlertOutbox).orderBy(desc(ownerAlertOutbox.queuedAt)).limit(Math.max(1, Math.min(limit, 100)));
}

export async function enqueueAndDispatchOwnerAlert(eventType: OwnerAlertEventType, referenceId: string, summary: string) {
  const alert = await enqueueOwnerAlert(eventType, referenceId, summary);
  return dispatchOwnerAlert(alert.id);
}

export async function createOwnerAlertAnnouncement() {
  return enqueueAndDispatchOwnerAlert("announcement", `ANN-${nanoid(10)}`, "Admin initiated an owner-only operational alert test.");
}

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

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function createLocalAgentAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
  onboarding?: { applicantType: "agent"; governmentIdUrl: string; workProofUrl: string };
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async (tx) => {
    const existingCredential = (await tx.select({ id: localCredentials.id })
      .from(localCredentials)
      .where(eq(localCredentials.email, input.email))
      .limit(1))[0];
    if (existingCredential) throw new Error("An AHC account already exists for this email. Sign in instead.");

    const localOpenId = `local_${nanoid(24)}`;
    await tx.insert(users).values({
      openId: localOpenId,
      name: input.name,
      email: input.email,
      loginMethod: "ahc_local",
      role: "user",
      lastSignedIn: new Date(),
    });
    const user = (await tx.select().from(users).where(eq(users.openId, localOpenId)).limit(1))[0];
    if (!user) throw new Error("Unable to create AHC account.");

    await tx.insert(localCredentials).values({
      userId: user.id,
      email: input.email,
      passwordHash: input.passwordHash,
    });
    if (input.onboarding) await tx.insert(onboardingApplications).values({ userId: user.id, ...input.onboarding });
    return user;
  });
}

export async function getLocalCredentialByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select({ user: users, credential: localCredentials })
    .from(localCredentials)
    .innerJoin(users, eq(localCredentials.userId, users.id))
    .where(eq(localCredentials.email, email))
    .limit(1))[0];
}

export async function recordLocalLoginFailure(email: string, now = new Date()) {
  const db = await getDb();
  if (!db) return;
  const credential = (await db.select()
    .from(localCredentials)
    .where(eq(localCredentials.email, email))
    .limit(1))[0];
  if (!credential) return;
  const attempts = credential.failedLoginAttempts + 1;
  const lockedUntil = attempts >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : credential.lockedUntil;
  await db.update(localCredentials).set({ failedLoginAttempts: attempts, lockedUntil }).where(eq(localCredentials.id, credential.id));
}

export async function clearLocalLoginFailures(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.transaction(async (tx) => {
    await tx.update(localCredentials).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(localCredentials.userId, userId));
    await tx.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
  });
}

/** Updates a verified legacy credential in place after successful sign-in. */
export async function upgradeLocalCredentialPasswordHash(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(localCredentials).set({ passwordHash }).where(eq(localCredentials.userId, userId));
}

const DEFAULT_PLATFORM_SETTINGS = {
  id: 1,
  /** Welcome Bundle price; column name remains migration-safe. */
  agentAccessFeeXaf: 3_000,
  /** Retained for historic Listing Pass receipts only. */
  listingPassFeeXaf: 1_000,
  starterAccessFeeXaf: 10_000,
  proAccessFeeXaf: 25_000,
  featuredPinFeeXaf: 2_500,
  routeBatchVerificationFeeXaf: 5_000,
  physicalVerificationFeeXaf: 7_500,
  fieldModeratorShareBps: DEFAULT_FIELD_MODERATOR_SHARE_BPS,
  ownerAlertsEnabled: true,
};

type PlatformCommercialSettingsInput = Pick<typeof DEFAULT_PLATFORM_SETTINGS,
  "agentAccessFeeXaf" | "starterAccessFeeXaf" | "proAccessFeeXaf" | "featuredPinFeeXaf"
  | "routeBatchVerificationFeeXaf" | "physicalVerificationFeeXaf" | "fieldModeratorShareBps" | "ownerAlertsEnabled">;

export async function getPlatformSettings() {
  const db = await getDb();
  if (!db) return { ...DEFAULT_PLATFORM_SETTINGS, updatedAt: new Date(), updatedByUserId: null };
  const existing = (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1))[0];
  if (existing) return existing;
  await db.insert(platformSettings).values(DEFAULT_PLATFORM_SETTINGS);
  return (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1))[0]!;
}

export async function updatePlatformSettings(actorUserId: number, input: PlatformCommercialSettingsInput) {
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

/** Assign operational authority only from an existing Admin session; public AHC registration always remains role=user. */
export async function setUserRole(actorUserId: number, targetUserId: number, role: "user" | "moderator" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (actorUserId === targetUserId) throw new Error("Administrators cannot change their own role.");
  const target = (await db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role })
    .from(users).where(eq(users.id, targetUserId)).limit(1))[0];
  if (!target) throw new Error("User not found.");
  if (target.openId === ENV.ownerOpenId && role !== "admin") throw new Error("The designated platform owner cannot be demoted.");
  if (target.role === role) return { success: true, role };

  await db.transaction(async (tx) => {
    await tx.update(users).set({ role }).where(eq(users.id, targetUserId));
    const moderatorProfile = (await tx.select({ id: moderatorProfiles.id }).from(moderatorProfiles)
      .where(eq(moderatorProfiles.userId, targetUserId)).limit(1))[0];
    if (role === "moderator") {
      if (moderatorProfile) {
        await tx.update(moderatorProfiles).set({ status: "active" }).where(eq(moderatorProfiles.id, moderatorProfile.id));
      } else {
        await tx.insert(moderatorProfiles).values({
          userId: targetUserId,
          displayName: target.name ?? target.email ?? `Field Moderator #${targetUserId}`,
          createdByUserId: actorUserId,
          status: "active",
        });
      }
    } else if (moderatorProfile) {
      await tx.update(moderatorProfiles).set({ status: "suspended" }).where(eq(moderatorProfiles.id, moderatorProfile.id));
    }
    await tx.insert(adminAuditEvents).values({
      action: "role_changed",
      actorUserId,
      targetUserId,
      details: `Role changed from ${target.role} to ${role}.`,
    });
  });
  return { success: true, role };
}

export async function getAdminCashFlowAudit() {
  const db = await getDb();
  if (!db) return { confirmedRevenueXaf: 0, physicalVerificationRevenueXaf: 0, platformCommissionAccruedXaf: 0, fieldModeratorCommissionAccruedXaf: 0, orders: [] as Array<{ type: string; amountXaf: number }> };
  const orders = await db.select({ type: paymentOrders.type, amountXaf: paymentOrders.amountXaf }).from(paymentOrders).where(eq(paymentOrders.status, "confirmed"));
  const commissions = await db.select({ fieldModeratorAmountXaf: fieldVerificationCommissions.fieldModeratorAmountXaf, platformAmountXaf: fieldVerificationCommissions.platformAmountXaf })
    .from(fieldVerificationCommissions).where(sql`${fieldVerificationCommissions.status} IN ('accrued', 'paid')`);
  const physicalVerificationOrderTypes = new Set(["physical_verification", "physical_verification_route_batch", "physical_verification_individual"]);
  return { confirmedRevenueXaf: orders.reduce((sum, order) => sum + order.amountXaf, 0), physicalVerificationRevenueXaf: orders.filter(order => physicalVerificationOrderTypes.has(order.type)).reduce((sum, order) => sum + order.amountXaf, 0), platformCommissionAccruedXaf: commissions.reduce((sum, item) => sum + item.platformAmountXaf, 0), fieldModeratorCommissionAccruedXaf: commissions.reduce((sum, item) => sum + item.fieldModeratorAmountXaf, 0), orders };
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
    evidenceReviewedAt: fieldVerificationCommissions.evidenceReviewedAt,
    evidenceReviewNote: fieldVerificationCommissions.evidenceReviewNote,
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
    evidenceReviewedAt: fieldVerificationCommissions.evidenceReviewedAt,
    evidenceReviewedByUserId: fieldVerificationCommissions.evidenceReviewedByUserId,
    evidenceReviewNote: fieldVerificationCommissions.evidenceReviewNote,
    paidAt: fieldVerificationCommissions.paidAt,
    createdAt: fieldVerificationCommissions.createdAt,
  }).from(fieldVerificationCommissions).innerJoin(verificationOrders, eq(fieldVerificationCommissions.verificationOrderId, verificationOrders.id)).innerJoin(users, eq(fieldVerificationCommissions.moderatorUserId, users.id)).orderBy(desc(fieldVerificationCommissions.createdAt));
}

/** Releases a held Field Moderator allocation only after an Admin has reviewed its stored field evidence. */
export async function approveHeldCommission(adminUserId: number, commissionId: number, evidenceReviewNote: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const commission = (await tx.select().from(fieldVerificationCommissions)
      .where(eq(fieldVerificationCommissions.id, commissionId)).limit(1))[0];
    if (!commission || commission.status !== "held") throw new Error("Only a held commission can be approved for payout.");
    const evidence = await tx.select({ kind: verificationEvidence.kind }).from(verificationEvidence)
      .where(eq(verificationEvidence.verificationOrderId, commission.verificationOrderId));
    if (evidence.length < 2 || !evidence.some(item => item.kind === "exterior")) {
      throw new Error("Cannot approve payout: the stored field visit does not meet AHC's minimum proof standard.");
    }
    const audit = (await tx.select({ status: verificationAudits.status }).from(verificationAudits)
      .where(eq(verificationAudits.verificationOrderId, commission.verificationOrderId)).limit(1))[0];
    if (audit && audit.status !== "confirmed") {
      throw new Error("Cannot approve payout: this verification is selected for an independent second-visit audit that is not yet confirmed.");
    }
    await tx.update(fieldVerificationCommissions).set({
      status: "accrued", evidenceReviewedAt: new Date(), evidenceReviewedByUserId: adminUserId,
      evidenceReviewNote,
    }).where(eq(fieldVerificationCommissions.id, commissionId));
    return { success: true } as const;
  });
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
    bedrooms: row.bedrooms,
    householdFit: row.householdFit,
    availableFrom: row.availableFrom,
    lastReconfirmed: row.lastReconfirmed,
    map: { latitude: Number(row.publicLatitude), longitude: Number(row.publicLongitude), radiusM: row.mapRadiusM },
    featured: Boolean(row.isFeatured) && (!row.featuredUntil || new Date(row.featuredUntil) > new Date()),
    verificationStatus: row.verificationStatus,
    photosCount: row.photosCount,
    walkthrough: row.walkthroughUrl && row.walkthroughStatus === "published" ? {
      url: row.walkthroughUrl,
      durationSeconds: row.walkthroughDurationSeconds,
      verifiedAt: row.walkthroughPublishedAt,
    } : null,
    neighborhoodEssentials: row.neighborhoodAssessmentId ? {
      waterAccess: row.waterAccess,
      powerReliability: row.powerReliability,
      roadAccess: row.roadAccess,
      taxiWalkMinutes: row.taxiWalkMinutes,
      junctionName: row.junctionName,
      junctionMinutes: row.junctionMinutes,
      assessedAt: row.assessedAt,
    } : null,
    trust: {
      guaranteedTotalCash: row.verificationStatus === "physical_verified" && !Boolean(row.hasOpenPricingConcern),
      guaranteeRule: "The itemized total is protected while this verified listing is active. Report any added platform or dossier fee before paying.",
      badges: [
        ...(!Boolean(row.hasOpenPricingConcern) ? [{ code: "price_transparent", label: "Price-transparent record" }] : []),
      ],
      responseMetricAvailable: false,
    },
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
    landmark: listings.landmark, propertyType: listings.propertyType, bedrooms: listings.bedrooms, householdFit: listings.householdFit,
    availableFrom: listings.availableFrom, lastReconfirmed: listings.lastReconfirmed,
    publicLatitude: listings.publicLatitude, publicLongitude: listings.publicLongitude, mapRadiusM: listings.mapRadiusM,
    isFeatured: listings.isFeatured, featuredUntil: listings.featuredUntil, verificationStatus: listings.verificationStatus,
    photosCount: listings.photosCount, agentNameSnapshot: listings.agentNameSnapshot,
    monthlyRent: listingCosts.monthlyRent, advanceMonths: listingCosts.advanceMonths,
    securityDeposit: listingCosts.securityDeposit, agencyFee: listingCosts.agencyFee,
    serviceFee: listingCosts.serviceFee, firstMonthUtilities: listingCosts.firstMonthUtilities,
    publicName: agentProfiles.publicName, whatsappPhone: agentProfiles.whatsappPhone,
    walkthroughUrl: listingWalkthroughVideos.mediaUrl, walkthroughStatus: listingWalkthroughVideos.status,
    walkthroughDurationSeconds: listingWalkthroughVideos.durationSeconds, walkthroughPublishedAt: listingWalkthroughVideos.publishedAt,
    neighborhoodAssessmentId: listingNeighborhoodAssessments.id,
    waterAccess: listingNeighborhoodAssessments.waterAccess, powerReliability: listingNeighborhoodAssessments.powerReliability,
    roadAccess: listingNeighborhoodAssessments.roadAccess, taxiWalkMinutes: listingNeighborhoodAssessments.taxiWalkMinutes,
    junctionName: listingNeighborhoodAssessments.junctionName, junctionMinutes: listingNeighborhoodAssessments.junctionMinutes,
    assessedAt: listingNeighborhoodAssessments.assessedAt,
    hasOpenPricingConcern: sql<number>`EXISTS (SELECT 1 FROM reports pricing_report WHERE pricing_report.listingId = ${listings.id} AND pricing_report.status = 'open' AND pricing_report.reason IN ('inaccurate_cost', 'unofficial_fee'))`,
  }).from(listings)
    .innerJoin(listingCosts, eq(listingCosts.listingId, listings.id))
    .leftJoin(agentProfiles, eq(agentProfiles.userId, listings.agentUserId))
    .leftJoin(listingWalkthroughVideos, and(eq(listingWalkthroughVideos.listingId, listings.id), eq(listingWalkthroughVideos.status, "published")))
    .leftJoin(listingNeighborhoodAssessments, eq(listingNeighborhoodAssessments.listingId, listings.id))
    .where(and(eq(listings.status, "published"), sql`${listings.lastReconfirmed} >= ${cutoff}`))
    .orderBy(
      desc(listings.isFeatured),
      desc(sql`CASE WHEN ${agentProfiles.subscriptionTier} = 'agency' AND ${agentProfiles.subscriptionStatus} = 'active' AND ${agentProfiles.subscriptionExpiresAt} >= NOW() THEN 1 ELSE 0 END`),
      desc(listings.lastReconfirmed),
    );

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

const APPOINTMENT_ACTIVE_STATUSES = new Set(["requested", "confirmed"]);
const APPOINTMENT_CONTACT_VISIBLE_STATUSES = new Set(["confirmed", "completed", "no_show"]);

function assertAppointmentWindow(requestedStart: Date, requestedEnd: Date, now = new Date()) {
  const minimumStart = new Date(now.getTime() + 60 * 60 * 1000);
  const maximumStart = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const durationMs = requestedEnd.getTime() - requestedStart.getTime();
  if (requestedStart < minimumStart) throw new Error("Choose a viewing time at least one hour from now.");
  if (requestedStart > maximumStart) throw new Error("Viewing requests must be within the next 14 days.");
  if (durationMs < 30 * 60 * 1000 || durationMs > 2 * 60 * 60 * 1000) {
    throw new Error("Choose a viewing window between 30 minutes and two hours.");
  }
}

async function getAppointmentEligibleListing(listingId: string, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const listing = (await db.select({
    id: listings.id,
    agentUserId: listings.agentUserId,
    status: listings.status,
    verificationStatus: listings.verificationStatus,
    lastReconfirmed: listings.lastReconfirmed,
  }).from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  const cutoff = new Date(now.getTime() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (!listing || listing.status !== "published" || listing.verificationStatus !== "physical_verified" || listing.lastReconfirmed < cutoff || !listing.agentUserId) {
    throw new Error("Viewing appointments are available only for fresh, physically verified live listings.");
  }
  return listing;
}

export async function createViewingAppointment(input: {
  seekerUserId: number;
  listingId: string;
  requestedStart: Date;
  requestedEnd: Date;
  contactPreference: "whatsapp" | "phone";
  privateContact: string;
  seekerNote?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  assertAppointmentWindow(input.requestedStart, input.requestedEnd, now);
  const listing = await getAppointmentEligibleListing(input.listingId, now);
  if (listing.agentUserId === input.seekerUserId) throw new Error("You cannot request a viewing for your own listing.");

  return db.transaction(async (tx) => {
    const seeker = (await tx.select({ isBanned: users.isBanned }).from(users).where(eq(users.id, input.seekerUserId)).limit(1))[0];
    if (!seeker || seeker.isBanned) throw new Error("This account cannot request a viewing appointment.");
    const existing = await tx.select({ id: viewingAppointments.id, status: viewingAppointments.status })
      .from(viewingAppointments)
      .where(and(eq(viewingAppointments.listingId, input.listingId), eq(viewingAppointments.seekerUserId, input.seekerUserId)));
    if (existing.some(item => APPOINTMENT_ACTIVE_STATUSES.has(item.status))) {
      throw new Error("You already have an active viewing request for this listing.");
    }
    await tx.insert(viewingAppointments).values({
      listingId: input.listingId,
      seekerUserId: input.seekerUserId,
      agentUserId: listing.agentUserId!,
      requestedStart: input.requestedStart,
      requestedEnd: input.requestedEnd,
      contactPreference: input.contactPreference,
      privateContact: input.privateContact,
      seekerNote: input.seekerNote || null,
    });
    const appointment = (await tx.select().from(viewingAppointments)
      .where(and(eq(viewingAppointments.listingId, input.listingId), eq(viewingAppointments.seekerUserId, input.seekerUserId)))
      .orderBy(desc(viewingAppointments.createdAt)).limit(1))[0];
    if (!appointment) throw new Error("Unable to save the viewing request.");
    await tx.insert(viewingAppointmentEvents).values({
      appointmentId: appointment.id,
      action: "requested",
      toStatus: "requested",
      actorUserId: input.seekerUserId,
      note: input.seekerNote || null,
    });
    return { id: appointment.id, status: appointment.status, requestedStart: appointment.requestedStart, requestedEnd: appointment.requestedEnd };
  });
}

function appointmentListingFields() {
  return {
    id: viewingAppointments.id,
    listingId: viewingAppointments.listingId,
    seekerUserId: viewingAppointments.seekerUserId,
    agentUserId: viewingAppointments.agentUserId,
    requestedStart: viewingAppointments.requestedStart,
    requestedEnd: viewingAppointments.requestedEnd,
    contactPreference: viewingAppointments.contactPreference,
    privateContact: viewingAppointments.privateContact,
    seekerNote: viewingAppointments.seekerNote,
    agentNote: viewingAppointments.agentNote,
    status: viewingAppointments.status,
    respondedAt: viewingAppointments.respondedAt,
    cancelledAt: viewingAppointments.cancelledAt,
    outcomeRecordedAt: viewingAppointments.outcomeRecordedAt,
    createdAt: viewingAppointments.createdAt,
    listingTitle: listings.title,
    city: listings.city,
    neighborhood: listings.neighborhood,
    landmark: listings.landmark,
    seekerName: users.name,
  };
}

export async function listSeekerViewingAppointments(seekerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select(appointmentListingFields()).from(viewingAppointments)
    .innerJoin(listings, eq(viewingAppointments.listingId, listings.id))
    .innerJoin(users, eq(viewingAppointments.seekerUserId, users.id))
    .where(eq(viewingAppointments.seekerUserId, seekerUserId)).orderBy(desc(viewingAppointments.requestedStart));
  return rows.map(({ privateContact, seekerName, ...row }) => row);
}

export async function listAgentViewingAppointments(agentUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select(appointmentListingFields()).from(viewingAppointments)
    .innerJoin(listings, eq(viewingAppointments.listingId, listings.id))
    .innerJoin(users, eq(viewingAppointments.seekerUserId, users.id))
    .where(eq(viewingAppointments.agentUserId, agentUserId)).orderBy(desc(viewingAppointments.requestedStart));
  return rows.map(({ privateContact, ...row }) => ({
    ...row,
    seekerContact: APPOINTMENT_CONTACT_VISIBLE_STATUSES.has(row.status) ? privateContact : null,
  }));
}

export async function respondToViewingAppointment(input: {
  agentUserId: number;
  appointmentId: number;
  decision: "confirmed" | "declined";
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const appointment = (await tx.select().from(viewingAppointments).where(eq(viewingAppointments.id, input.appointmentId)).limit(1))[0];
    if (!appointment || appointment.agentUserId !== input.agentUserId) throw new Error("Viewing appointment not found.");
    if (appointment.status !== "requested") throw new Error("Only a new viewing request can be confirmed or declined.");
    if (input.decision === "confirmed") await getAppointmentEligibleListing(appointment.listingId);
    const now = new Date();
    await tx.update(viewingAppointments).set({ status: input.decision, agentNote: input.note || null, respondedAt: now })
      .where(eq(viewingAppointments.id, appointment.id));
    await tx.insert(viewingAppointmentEvents).values({
      appointmentId: appointment.id,
      action: input.decision,
      fromStatus: appointment.status,
      toStatus: input.decision,
      actorUserId: input.agentUserId,
      note: input.note || null,
    });
    return { success: true, status: input.decision } as const;
  });
}

export async function cancelViewingAppointment(input: { userId: number; appointmentId: number; actor: "seeker" | "agent"; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const appointment = (await tx.select().from(viewingAppointments).where(eq(viewingAppointments.id, input.appointmentId)).limit(1))[0];
    const isOwner = input.actor === "seeker" ? appointment?.seekerUserId === input.userId : appointment?.agentUserId === input.userId;
    if (!appointment || !isOwner) throw new Error("Viewing appointment not found.");
    if (!APPOINTMENT_ACTIVE_STATUSES.has(appointment.status)) throw new Error("This viewing appointment can no longer be cancelled.");
    if (appointment.requestedStart <= new Date()) throw new Error("A viewing that has already started cannot be cancelled here.");
    const now = new Date();
    await tx.update(viewingAppointments).set({ status: "cancelled", cancelledAt: now, agentNote: input.actor === "agent" ? (input.note || appointment.agentNote) : appointment.agentNote })
      .where(eq(viewingAppointments.id, appointment.id));
    await tx.insert(viewingAppointmentEvents).values({
      appointmentId: appointment.id,
      action: input.actor === "seeker" ? "cancelled_by_seeker" : "cancelled_by_agent",
      fromStatus: appointment.status,
      toStatus: "cancelled",
      actorUserId: input.userId,
      note: input.note || null,
    });
    return { success: true } as const;
  });
}

export async function recordViewingAppointmentOutcome(input: { agentUserId: number; appointmentId: number; outcome: "completed" | "no_show"; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const appointment = (await tx.select().from(viewingAppointments).where(eq(viewingAppointments.id, input.appointmentId)).limit(1))[0];
    if (!appointment || appointment.agentUserId !== input.agentUserId) throw new Error("Viewing appointment not found.");
    if (appointment.status !== "confirmed") throw new Error("Only a confirmed viewing can receive an outcome.");
    if (appointment.requestedStart > new Date()) throw new Error("A viewing outcome can be recorded only after the requested start time.");
    const now = new Date();
    await tx.update(viewingAppointments).set({ status: input.outcome, agentNote: input.note || appointment.agentNote, outcomeRecordedAt: now })
      .where(eq(viewingAppointments.id, appointment.id));
    await tx.insert(viewingAppointmentEvents).values({
      appointmentId: appointment.id,
      action: input.outcome,
      fromStatus: appointment.status,
      toStatus: input.outcome,
      actorUserId: input.agentUserId,
      note: input.note || null,
    });
    return { success: true, status: input.outcome } as const;
  });
}

export async function listAdminViewingAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: viewingAppointments.id,
    listingId: viewingAppointments.listingId,
    status: viewingAppointments.status,
    requestedStart: viewingAppointments.requestedStart,
    requestedEnd: viewingAppointments.requestedEnd,
    createdAt: viewingAppointments.createdAt,
    city: listings.city,
    neighborhood: listings.neighborhood,
  }).from(viewingAppointments).innerJoin(listings, eq(viewingAppointments.listingId, listings.id)).orderBy(desc(viewingAppointments.createdAt));
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
    const isPro = agent.subscriptionTier === "agency";
    if (isPro) {
      const activeListings = await tx.select({ id: listings.id }).from(listings).where(and(
        eq(listings.agentUserId, input.agentUserId),
        sql`${listings.status} IN ('under_review', 'changes_requested', 'published', 'needs_reconfirmation')`,
      ));
      if (activeListings.length >= PRO_ACTIVE_LISTING_LIMIT) {
        throw new Error(`Pro Access supports up to ${PRO_ACTIVE_LISTING_LIMIT} active listings. Archive or resolve an existing listing before submitting another.`);
      }
    }
    const credit = isPro ? undefined : (await tx.select().from(listingCredits).where(and(
      eq(listingCredits.userId, input.agentUserId),
      sql`${listingCredits.status} IN ('available', 'restored')`,
      sql`(${listingCredits.expiresAt} IS NULL OR ${listingCredits.expiresAt} >= ${now})`,
    )).orderBy(listingCredits.createdAt).limit(1))[0];
    if (!isPro && !credit) throw new Error("Your Welcome Bundle or Starter Access includes five listing credits. Reconcile a qualifying plan before submitting a new listing.");
    await tx.insert(listings).values({
      id, title: input.title, city: input.city, neighborhood: input.neighborhood, landmark: input.landmark,
      propertyType: input.propertyType, householdFit: input.householdFit ?? null, availableFrom: new Date(input.availableFrom),
      status: "under_review", agentUserId: input.agentUserId, agentNameSnapshot: input.agentNameSnapshot,
      publicLatitude: String(input.publicLatitude), publicLongitude: String(input.publicLongitude), mapRadiusM: input.mapRadiusM,
    });
    await tx.insert(listingCosts).values({ listingId: id, ...input.costs });
    if (credit) {
      await tx.update(listingCredits).set({ status: "consumed", usedForListingId: id, consumedAt: now })
        .where(eq(listingCredits.id, credit.id));
    }
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

export type ListingReportReason = "inaccurate_cost" | "unavailable" | "misleading_details" | "unofficial_fee" | "other";

export function shouldApplyListingSafetyHold(reason: ListingReportReason, matchingOpenReportCount: number) {
  return (reason === "inaccurate_cost" || reason === "unavailable") && matchingOpenReportCount >= 3;
}

/**
 * Stores one accountable report per seeker and listing. Three distinct
 * inaccurate-cost or unavailable-listing reports immediately remove the
 * listing from public search, revoke its verification state, and pause the
 * responsible Agent's commercial access pending an Admin review. This is a
 * listing safety hold, not a final finding of misconduct.
 */
export async function createListingReport(reporterUserId: number, listingId: string, reason: ListingReportReason, note: string, reporterNetworkFingerprint: string | null = null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const outcome = await db.transaction(async (tx) => {
    const listing = (await tx.select({ id: listings.id, status: listings.status, agentUserId: listings.agentUserId })
      .from(listings).where(eq(listings.id, listingId)).limit(1))[0];
    if (!listing || listing.status !== "published") throw new Error("This listing is no longer available for reports.");

    const existing = (await tx.select({ id: reports.id }).from(reports).where(and(
      eq(reports.listingId, listingId), eq(reports.reporterUserId, reporterUserId),
    )).limit(1))[0];
    if (existing) throw new Error("You have already reported this listing. AHC will review your existing report.");

    await tx.insert(reports).values({ listingId, reporterUserId, reason, note, reporterNetworkFingerprint });
    const safetyReason = reason === "inaccurate_cost" || reason === "unavailable" ? reason : undefined;
    const matchingOpenReports = safetyReason ? await tx.select({ id: reports.id }).from(reports).where(and(
      eq(reports.listingId, listingId), eq(reports.reason, safetyReason), eq(reports.status, "open"),
    )) : [];
    const automaticSafetyAction = safetyReason ? shouldApplyListingSafetyHold(safetyReason, matchingOpenReports.length) : false;
    const safetySummary = safetyReason === "unavailable" ? "Automatic safety hold after three distinct unavailable-listing reports; Admin review required." : "Automatic safety hold after three distinct inaccurate-cost reports; Admin review required.";

    if (automaticSafetyAction) {
      await tx.update(listings).set({
        status: "suspended", verificationStatus: "unverified", verificationExpiresAt: null,
        reviewSummary: safetySummary,
      }).where(eq(listings.id, listingId));
      await tx.insert(listingReviewEvents).values({
        listingId, action: "suspended", fromStatus: listing.status, toStatus: "suspended",
        reason: safetySummary,
      });
      if (listing.agentUserId) {
        await tx.update(agentProfiles).set({ subscriptionStatus: "suspended" })
          .where(eq(agentProfiles.userId, listing.agentUserId));
      }
    }
    return { success: true, automaticSafetyAction, openReportCount: matchingOpenReports.length, safetyReason: safetyReason ?? null };
  });
  if (outcome.automaticSafetyAction) {
    await enqueueAndDispatchOwnerAlert("safety_hold_applied", listingId, "Automatic three-report listing safety hold applied; Admin review required.");
  }
  return outcome;
}

/** Logs only an authenticated seeker's outbound-contact intent before redirecting to WhatsApp. */
export async function createWhatsAppLeadEvent(seekerUserId: number, listingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const contact = await getPublicListingContact(listingId);
  if (!contact?.agent.whatsappPhone) throw new Error("This listing is no longer available for contact.");
  const listing = (await db.select({ agentUserId: listings.agentUserId }).from(listings)
    .where(eq(listings.id, listingId)).limit(1))[0];
  await db.insert(leadEvents).values({
    listingId, seekerUserId, contactUserId: listing?.agentUserId ?? null, channel: "whatsapp",
  });
  return { url: createWhatsAppListingLink(contact.agent.whatsappPhone, contact.id) };
}

/** Private Admin audit data: report content remains off the public marketplace. */
export async function listAdminTrustReports() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: reports.id, listingId: reports.listingId, reason: reports.reason, note: reports.note,
    status: reports.status, filedAt: reports.filedAt, reporterUserId: reports.reporterUserId,
    reporterNetworkFingerprint: reports.reporterNetworkFingerprint, reporterCreatedAt: users.createdAt,
    listingTitle: listings.title, listingStatus: listings.status, agentUserId: listings.agentUserId,
    agentName: listings.agentNameSnapshot,
  }).from(reports).innerJoin(listings, eq(listings.id, reports.listingId))
    .leftJoin(users, eq(users.id, reports.reporterUserId)).orderBy(desc(reports.filedAt));
  const networkCounts = new Map<string, number>();
  rows.forEach(row => {
    if (row.reporterNetworkFingerprint) networkCounts.set(row.reporterNetworkFingerprint, (networkCounts.get(row.reporterNetworkFingerprint) ?? 0) + 1);
  });
  const now = Date.now();
  return rows.map(({ reporterNetworkFingerprint, reporterCreatedAt, ...row }) => {
    const reporterAccountAgeDays = reporterCreatedAt ? Math.max(0, Math.floor((now - reporterCreatedAt.getTime()) / 86_400_000)) : null;
    const networkPatternCount = reporterNetworkFingerprint ? networkCounts.get(reporterNetworkFingerprint) ?? 1 : 0;
    return {
      ...row,
      reporterAccountAgeDays,
      networkPatternCount,
      integritySignals: {
        recentAccount: reporterAccountAgeDays !== null && reporterAccountAgeDays < 7,
        clusteredNetwork: networkPatternCount >= 2,
      },
    };
  });
}

/** Reopens a safety-held listing only after documented Admin review; all currently open reports are resolved together. */
export async function releaseListingSafetyHold(operatorUserId: number, listingId: string, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const outcome = await db.transaction(async (tx) => {
    const listing = (await tx.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
    if (!listing) throw new Error("Listing not found.");
    if (listing.status !== "suspended") throw new Error("Only a suspended listing can be released from a safety hold.");
    const now = new Date();
    await tx.update(listings).set({
      status: "published",
      reviewedAt: now,
      reviewedByUserId: operatorUserId,
      reviewSummary: `Safety hold released by Admin: ${reason}`,
      lastReconfirmed: now,
      freshnessWindowDays: FRESHNESS_WINDOW_DAYS,
    }).where(eq(listings.id, listingId));
    await tx.update(reports).set({ status: "resolved" })
      .where(and(eq(reports.listingId, listingId), eq(reports.status, "open")));
    await tx.insert(listingReviewEvents).values({
      listingId,
      action: "released",
      fromStatus: "suspended",
      toStatus: "published",
      reason,
      actorUserId: operatorUserId,
    });
    return { success: true, status: "published" as const };
  });
  await enqueueAndDispatchOwnerAlert("safety_hold_released", listingId, "Admin released a listing safety hold after documented review.");
  return outcome;
}

/** Private Admin audit data; deliberately excludes message content, phone numbers, IP addresses, and location. */
export async function listAdminLeadEvents() {
  const db = await getDb();
  if (!db) return [];
  const events = await db.select({
    id: leadEvents.id, listingId: leadEvents.listingId, seekerUserId: leadEvents.seekerUserId,
    contactUserId: leadEvents.contactUserId, channel: leadEvents.channel, createdAt: leadEvents.createdAt,
    listingTitle: listings.title, city: listings.city, neighborhood: listings.neighborhood,
  }).from(leadEvents).innerJoin(listings, eq(listings.id, leadEvents.listingId)).orderBy(desc(leadEvents.createdAt));
  return summarizeAdminLeadEvents(events);
}

export async function createPaymentOrder(userId: number, type: PaidOfferType, listingId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const offer = getPaidOffer(type);
  const settings = await getPlatformSettings();
  const amountByType = {
    welcome_bundle: settings.agentAccessFeeXaf,
    starter_access: settings.starterAccessFeeXaf,
    pro_access: settings.proAccessFeeXaf,
    agent_access: settings.agentAccessFeeXaf,
    listing_pass: settings.listingPassFeeXaf,
    featured_pin: settings.featuredPinFeeXaf,
    physical_verification_route_batch: settings.routeBatchVerificationFeeXaf,
    physical_verification_individual: settings.physicalVerificationFeeXaf,
    physical_verification: settings.physicalVerificationFeeXaf,
  } as const;
  const amountXaf = amountByType[type];

  if (type === "welcome_bundle") {
    const profile = (await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId)).limit(1))[0];
    if (!profile) throw new Error("Create your Agent profile before purchasing the New-Agent Welcome Bundle.");
    const priorPaidAccess = (await db.select({ id: paymentOrders.id }).from(paymentOrders).where(and(
      eq(paymentOrders.userId, userId),
      eq(paymentOrders.status, "confirmed"),
      sql`${paymentOrders.type} IN ('agent_access', 'welcome_bundle', 'starter_access', 'pro_access')`,
    )).limit(1))[0];
    if (profile.welcomeBundleUsedAt || priorPaidAccess) {
      throw new Error("The 3,000 XAF New-Agent Welcome Bundle is available only for your first paid month. Choose Starter or Pro Access.");
    }
  }

  if (type === "starter_access" || type === "pro_access") {
    const profile = (await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId)).limit(1))[0];
    if (!profile) throw new Error("Create your Agent profile before purchasing recurring Agent Access.");
    const hasPriorPaidAccess = (await db.select({ id: paymentOrders.id }).from(paymentOrders).where(and(
      eq(paymentOrders.userId, userId),
      eq(paymentOrders.status, "confirmed"),
      sql`${paymentOrders.type} IN ('agent_access', 'welcome_bundle', 'starter_access', 'pro_access')`,
    )).limit(1))[0];
    if (!hasPriorPaidAccess) throw new Error("Your first paid month begins with the 3,000 XAF New-Agent Welcome Bundle.");
    const firstMonthStillActive = Boolean(
      profile.welcomeBundleUsedAt
      && profile.subscriptionStatus === "active"
      && profile.subscriptionExpiresAt
      && profile.subscriptionExpiresAt.getTime() >= Date.now(),
    );
    if (firstMonthStillActive) throw new Error("Starter and Pro Access become available after your first Welcome Bundle month ends.");
  }

  const requiresListing = type === "featured_pin"
    || type === "physical_verification"
    || type === "physical_verification_route_batch"
    || type === "physical_verification_individual";
  if (requiresListing && !listingId) throw new Error("Select one of your listings before requesting this paid service.");

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
    officialReceiptCode: paymentOrders.officialReceiptCode, receiptIssuedAt: paymentOrders.receiptIssuedAt,
  }).from(paymentOrders).where(eq(paymentOrders.userId, userId)).orderBy(desc(paymentOrders.createdAt));
}

function officialServiceReceiptFields() {
  return {
    orderId: paymentOrders.id,
    serviceType: paymentOrders.type,
    amountXaf: paymentOrders.amountXaf,
    provider: paymentOrders.provider,
    providerReference: paymentOrders.providerReference,
    officialReceiptCode: paymentOrders.officialReceiptCode,
    receiptIssuedAt: paymentOrders.receiptIssuedAt,
    reconciledAt: paymentOrders.reconciledAt,
    payerName: agentProfiles.publicName,
    accountName: users.name,
    accountEmail: users.email,
    listingTitle: listings.title,
  };
}

export async function getAgentOfficialServiceReceipt(userId: number, orderId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select(officialServiceReceiptFields()).from(paymentOrders)
    .innerJoin(users, eq(users.id, paymentOrders.userId))
    .leftJoin(agentProfiles, eq(agentProfiles.userId, paymentOrders.userId))
    .leftJoin(listings, eq(listings.id, paymentOrders.listingId))
    .where(and(
      eq(paymentOrders.id, orderId),
      eq(paymentOrders.userId, userId),
      eq(paymentOrders.status, "confirmed"),
      isNotNull(paymentOrders.officialReceiptCode),
      isNotNull(paymentOrders.receiptIssuedAt),
    )).limit(1))[0] ?? null;
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
  const activeListingRows = effectiveProfile?.subscriptionTier === "agency"
    ? await db.select({ id: listings.id }).from(listings).where(and(
      eq(listings.agentUserId, userId),
      sql`${listings.status} IN ('under_review', 'changes_requested', 'published', 'needs_reconfirmation')`,
    ))
    : [];
  return {
    profile: effectiveProfile,
    availableCredits: creditRows.length,
    activeListingCount: activeListingRows.length,
    activeListingLimit: effectiveProfile?.subscriptionTier === "agency" ? PRO_ACTIVE_LISTING_LIMIT : null,
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

export async function getAdminOfficialServiceReceipt(orderId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select(officialServiceReceiptFields()).from(paymentOrders)
    .innerJoin(users, eq(users.id, paymentOrders.userId))
    .leftJoin(agentProfiles, eq(agentProfiles.userId, paymentOrders.userId))
    .leftJoin(listings, eq(listings.id, paymentOrders.listingId))
    .where(and(
      eq(paymentOrders.id, orderId),
      eq(paymentOrders.status, "confirmed"),
      isNotNull(paymentOrders.officialReceiptCode),
      isNotNull(paymentOrders.receiptIssuedAt),
    )).limit(1))[0] ?? null;
}

export async function reconcilePaymentOrder(operatorUserId: number, orderId: string, decision: "confirmed" | "rejected", note: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const outcome = await db.transaction(async (tx) => {
    const order = (await tx.select().from(paymentOrders).where(eq(paymentOrders.id, orderId)).limit(1))[0];
    if (!order || order.status !== "reference_submitted") throw new Error("Only submitted payment references can be reconciled.");
    const now = new Date();
    if (decision === "confirmed" && order.type === "welcome_bundle") {
      const profile = (await tx.select().from(agentProfiles).where(eq(agentProfiles.userId, order.userId)).limit(1))[0];
      const priorPaidAccess = (await tx.select({ id: paymentOrders.id }).from(paymentOrders).where(and(
        eq(paymentOrders.userId, order.userId),
        eq(paymentOrders.status, "confirmed"),
        sql`${paymentOrders.id} <> ${order.id}`,
        sql`${paymentOrders.type} IN ('agent_access', 'welcome_bundle', 'starter_access', 'pro_access')`,
      )).limit(1))[0];
      if (!profile || profile.welcomeBundleUsedAt || priorPaidAccess) {
        throw new Error("The New-Agent Welcome Bundle may be confirmed only once, before any recurring paid access.");
      }
    }
    const officialReceiptCode = decision === "confirmed"
      ? `AHC-${now.getUTCFullYear()}-${order.id.slice(-8)}`
      : null;
    await tx.update(paymentOrders).set({
      status: decision, reconciledAt: now, reconciledByUserId: operatorUserId, reconciliationNote: note,
      ...(officialReceiptCode ? { officialReceiptCode, receiptIssuedAt: now } : {}),
    }).where(eq(paymentOrders.id, orderId));
    if (decision === "rejected") return { status: "rejected" as const };

    const offer = getPaidOffer(order.type);
    const expiresAt = new Date(now.getTime() + offer.validityDays * 24 * 60 * 60 * 1000);
    const accessEntitlementByType: Partial<Record<PaidOfferType, {
      subscriptionTier: "access" | "growth" | "agency";
      listingCredits: number;
      marksWelcomeBundleUsed: boolean;
    }>> = {
      welcome_bundle: { subscriptionTier: "access", listingCredits: 5, marksWelcomeBundleUsed: true },
      starter_access: { subscriptionTier: "growth", listingCredits: 5, marksWelcomeBundleUsed: false },
      pro_access: { subscriptionTier: "agency", listingCredits: 0, marksWelcomeBundleUsed: false },
      agent_access: { subscriptionTier: "access", listingCredits: 1, marksWelcomeBundleUsed: false },
    };
    const accessEntitlement = accessEntitlementByType[order.type];
    if (accessEntitlement) {
      await tx.update(agentProfiles).set({
        subscriptionStatus: "active",
        subscriptionTier: accessEntitlement.subscriptionTier,
        subscriptionExpiresAt: expiresAt,
        ...(accessEntitlement.marksWelcomeBundleUsed ? { welcomeBundleUsedAt: now } : {}),
      }).where(eq(agentProfiles.userId, order.userId));
      for (let creditIndex = 0; creditIndex < accessEntitlement.listingCredits; creditIndex += 1) {
        await tx.insert(listingCredits).values({ userId: order.userId, paymentOrderId: order.id, expiresAt });
      }
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
    const verificationServiceByOrderType: Partial<Record<PaidOfferType, "route_batch" | "individual">> = {
      physical_verification: "individual",
      physical_verification_route_batch: "route_batch",
      physical_verification_individual: "individual",
    };
    const verificationServiceType = verificationServiceByOrderType[order.type];
    if (verificationServiceType && order.listingId) {
      await tx.insert(verificationOrders).values({
        listingId: order.listingId, requestedByUserId: order.userId, status: "paid", serviceType: verificationServiceType, amountXaf: order.amountXaf,
        providerReference: order.providerReference,
      });
    }
    return { status: "confirmed" as const, officialReceiptCode };
  });
  await enqueueAndDispatchOwnerAlert(
    decision === "confirmed" ? "payment_confirmed" : "payment_rejected",
    orderId,
    decision === "confirmed" ? "Admin confirmed an AHC platform-service order." : "Admin rejected an AHC platform-service order.",
  );
  return outcome;
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

/**
 * Protected operations view for grouping unassigned, already-paid field visits.
 * It intentionally exposes only the same approximate locality fields already used
 * in the private verification queue; exact compound access remains a post-claim,
 * Agent-coordinated step.
 */
export async function listModeratorVerificationBatches() {
  const db = await getDb();
  if (!db) return [];

  const settings = await getPlatformSettings();
  const rows = await db.select({
    verificationOrderId: verificationOrders.id,
    listingId: listings.id,
    title: listings.title,
    city: listings.city,
    neighborhood: listings.neighborhood,
    landmark: listings.landmark,
    amountXaf: verificationOrders.amountXaf,
    createdAt: verificationOrders.createdAt,
  }).from(verificationOrders)
    .innerJoin(listings, eq(listings.id, verificationOrders.listingId))
    .where(and(eq(verificationOrders.status, "paid"), sql`${verificationOrders.assignedModeratorUserId} IS NULL`))
    .orderBy(verificationOrders.createdAt);

  const batches = new Map<string, {
    city: string;
    neighborhood: string;
    landmarkAreas: string[];
    earliestRequestedAt: Date;
    estimatedFieldEarningsXaf: number;
    work: Array<{ verificationOrderId: number; listingId: string; title: string; landmark: string; requestedAt: Date }>;
  }>();

  for (const row of rows) {
    const key = `${row.city}::${row.neighborhood}`;
    const existing = batches.get(key);
    const estimatedEarnings = Math.floor((row.amountXaf * settings.fieldModeratorShareBps) / 10_000);
    const workItem = { verificationOrderId: row.verificationOrderId, listingId: row.listingId, title: row.title, landmark: row.landmark, requestedAt: row.createdAt };
    if (existing) {
      existing.estimatedFieldEarningsXaf += estimatedEarnings;
      if (!existing.landmarkAreas.includes(row.landmark)) existing.landmarkAreas.push(row.landmark);
      existing.work.push(workItem);
      if (row.createdAt < existing.earliestRequestedAt) existing.earliestRequestedAt = row.createdAt;
    } else {
      batches.set(key, {
        city: row.city,
        neighborhood: row.neighborhood,
        landmarkAreas: [row.landmark],
        earliestRequestedAt: row.createdAt,
        estimatedFieldEarningsXaf: estimatedEarnings,
        work: [workItem],
      });
    }
  }

  return Array.from(batches.values())
    .map(batch => ({ ...batch, landmarkAreas: batch.landmarkAreas.slice(0, 4), workCount: batch.work.length }))
    .sort((a, b) => b.workCount - a.workCount || a.earliestRequestedAt.getTime() - b.earliestRequestedAt.getTime());
}

/** Private staff view. Public marketplace queries never select proof URLs or observations. */
export async function listOperationsVerificationEvidence() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: verificationEvidence.id,
    verificationOrderId: verificationEvidence.verificationOrderId,
    kind: verificationEvidence.kind,
    mediaUrl: verificationEvidence.mediaUrl,
    listingMatch: verificationEvidence.listingMatch,
    observation: verificationEvidence.observation,
    capturedByUserId: verificationEvidence.capturedByUserId,
    createdAt: verificationEvidence.createdAt,
    verificationStatus: verificationOrders.status,
    evidenceNote: verificationOrders.evidenceNote,
    listingId: listings.id,
    title: listings.title,
    city: listings.city,
    neighborhood: listings.neighborhood,
  }).from(verificationEvidence)
    .innerJoin(verificationOrders, eq(verificationOrders.id, verificationEvidence.verificationOrderId))
    .innerJoin(listings, eq(listings.id, verificationOrders.listingId))
    .orderBy(desc(verificationEvidence.createdAt));
}

/** A 20% sample is selected only when another active Field Moderator can conduct a truly independent visit. */
export function shouldSelectSecondVerifierAudit(randomValue = Math.random()) {
  return Number.isFinite(randomValue) && randomValue >= 0 && randomValue < 0.2;
}

/** Private staff queue; public marketplace queries never select audit proof. */
export async function listVerificationAuditQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: verificationAudits.id,
    verificationOrderId: verificationAudits.verificationOrderId,
    listingId: verificationOrders.listingId,
    title: listings.title,
    city: listings.city,
    neighborhood: listings.neighborhood,
    status: verificationAudits.status,
    primaryModeratorUserId: verificationAudits.primaryModeratorUserId,
    auditorUserId: verificationAudits.auditorUserId,
    listingMatch: verificationAudits.listingMatch,
    exteriorProofUrl: verificationAudits.exteriorProofUrl,
    supportingProofUrl: verificationAudits.supportingProofUrl,
    observation: verificationAudits.observation,
    selectedAt: verificationAudits.selectedAt,
    completedAt: verificationAudits.completedAt,
  }).from(verificationAudits)
    .innerJoin(verificationOrders, eq(verificationAudits.verificationOrderId, verificationOrders.id))
    .innerJoin(listings, eq(verificationOrders.listingId, listings.id))
    .orderBy(desc(verificationAudits.selectedAt));
}

export async function claimVerificationAudit(auditorUserId: number, auditId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const audit = (await tx.select().from(verificationAudits).where(eq(verificationAudits.id, auditId)).limit(1))[0];
    if (!audit || audit.status !== "selected") throw new Error("This independent audit is not available to claim.");
    if (audit.primaryModeratorUserId === auditorUserId) throw new Error("The original Field Moderator cannot audit their own visit.");
    await tx.update(verificationAudits).set({ auditorUserId, status: "claimed" }).where(eq(verificationAudits.id, auditId));
    return { success: true } as const;
  });
}

export async function completeVerificationAudit(
  auditorUserId: number,
  auditId: number,
  outcome: "confirmed" | "disputed",
  listingMatch: "matches" | "partially_matches" | "does_not_match",
  exteriorProofUrl: string,
  supportingProofUrl: string,
  observation: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const audit = (await tx.select().from(verificationAudits).where(eq(verificationAudits.id, auditId)).limit(1))[0];
    if (!audit || audit.status !== "claimed" || audit.auditorUserId !== auditorUserId) {
      throw new Error("Only the assigned independent Field Moderator can complete this audit.");
    }
    if (audit.primaryModeratorUserId === auditorUserId) throw new Error("The original Field Moderator cannot audit their own visit.");
    await tx.update(verificationAudits).set({
      status: outcome,
      listingMatch,
      exteriorProofUrl,
      supportingProofUrl,
      observation,
      completedAt: new Date(),
    }).where(eq(verificationAudits.id, auditId));
    return { success: true, outcome } as const;
  });
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

export type FieldVerificationEvidenceInput = {
  kind: "exterior" | "interior" | "bathroom" | "document" | "other";
  mediaUrl: string;
  listingMatch: "matches" | "partially_matches" | "does_not_match";
  observation: string;
};

export function validateFieldVerificationEvidence(evidence: FieldVerificationEvidenceInput[]) {
  if (evidence.length < 2 || !evidence.some(item => item.kind === "exterior")) {
    throw new Error("Field verification requires at least two proof images, including an exterior comparison image.");
  }
}

export type NeighborhoodAssessmentInput = {
  waterAccess: "borehole_on_site" | "water_storage_seen" | "public_network_observed" | "not_confirmed";
  powerReliability: "backup_seen" | "prepaid_meter_seen" | "local_low_outage_assessment" | "local_outage_caution" | "not_confirmed";
  roadAccess: "tarred_to_gate" | "tarred_nearby" | "dirt_track_to_gate" | "not_confirmed";
  taxiWalkMinutes?: number | null;
  junctionName?: string | null;
  junctionMinutes?: number | null;
  observationNote: string;
};

export async function registerWalkthroughVideo(input: {
  operatorUserId: number;
  verificationOrderId: number;
  storageKey: string;
  mediaUrl: string;
  durationSeconds: number;
  orientation: "vertical";
  listingMatch: "matches" | "partially_matches" | "does_not_match";
}) {
  if (!Number.isInteger(input.durationSeconds) || input.durationSeconds < 15 || input.durationSeconds > 30) {
    throw new Error("A premium walk-through must be an unedited 15–30 second video.");
  }
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const order = (await tx.select().from(verificationOrders).where(eq(verificationOrders.id, input.verificationOrderId)).limit(1))[0];
    if (!order || order.status !== "scheduled" || order.assignedModeratorUserId !== input.operatorUserId) {
      throw new Error("Only the assigned Field Moderator may attach a walk-through to a claimed visit.");
    }
    await tx.insert(listingWalkthroughVideos).values({
      listingId: order.listingId,
      verificationOrderId: order.id,
      capturedByUserId: input.operatorUserId,
      storageKey: input.storageKey,
      mediaUrl: input.mediaUrl,
      durationSeconds: input.durationSeconds,
      orientation: input.orientation,
      listingMatch: input.listingMatch,
      status: "captured",
    }).onDuplicateKeyUpdate({
      set: {
        storageKey: input.storageKey,
        mediaUrl: input.mediaUrl,
        durationSeconds: input.durationSeconds,
        orientation: input.orientation,
        listingMatch: input.listingMatch,
        capturedByUserId: input.operatorUserId,
        status: "captured",
        publishedAt: null,
      },
    });
    return { listingId: order.listingId, durationSeconds: input.durationSeconds };
  });
}

export async function decideVerificationOrder(
  operatorUserId: number,
  verificationOrderId: number,
  decision: "passed" | "failed",
  evidenceNote: string,
  evidence: FieldVerificationEvidenceInput[],
  neighborhood?: NeighborhoodAssessmentInput,
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const outcome = await db.transaction(async (tx) => {
    const order = (await tx.select().from(verificationOrders).where(eq(verificationOrders.id, verificationOrderId)).limit(1))[0];
    if (!order || order.status !== "scheduled") throw new Error("Only claimed verification requests can receive a field outcome.");
    if (order.assignedModeratorUserId !== operatorUserId) throw new Error("Only the assigned reviewer can record this verification outcome.");
    validateFieldVerificationEvidence(evidence);
    const walkthrough = (await tx.select().from(listingWalkthroughVideos)
      .where(and(eq(listingWalkthroughVideos.verificationOrderId, verificationOrderId), eq(listingWalkthroughVideos.capturedByUserId, operatorUserId)))
      .limit(1))[0];
    if (decision === "passed") {
      if (!walkthrough || walkthrough.orientation !== "vertical" || walkthrough.durationSeconds < 15 || walkthrough.durationSeconds > 30) {
        throw new Error("A passed premium verification requires the assigned moderator's 15–30 second vertical walk-through video.");
      }
      if (!neighborhood) throw new Error("A passed premium verification requires a structured neighborhood-essentials assessment.");
    }
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
    await tx.insert(verificationEvidence).values(evidence.map(item => ({ ...item, verificationOrderId, capturedByUserId: operatorUserId })));
    if (decision === "passed" && walkthrough && neighborhood) {
      await tx.update(listingWalkthroughVideos).set({ status: "published", publishedAt: now })
        .where(eq(listingWalkthroughVideos.id, walkthrough.id));
      await tx.insert(listingNeighborhoodAssessments).values({
        listingId: order.listingId,
        verificationOrderId,
        assessedByUserId: operatorUserId,
        ...neighborhood,
      }).onDuplicateKeyUpdate({ set: { ...neighborhood, assessedByUserId: operatorUserId, assessedAt: now } });
    } else if (walkthrough) {
      await tx.update(listingWalkthroughVideos).set({ status: "withheld", publishedAt: null })
        .where(eq(listingWalkthroughVideos.id, walkthrough.id));
    }
    if (decision === "passed") {
      const settings = await getPlatformSettings();
      const allocation = calculateFieldVerificationCommission(order.amountXaf, settings.fieldModeratorShareBps);
      await tx.insert(fieldVerificationCommissions).values({ verificationOrderId, moderatorUserId: operatorUserId, ...allocation, status: "held" });
      const alternateModerator = (await tx.select({ id: users.id }).from(users)
        .where(and(eq(users.role, "moderator"), eq(users.isBanned, false), ne(users.id, operatorUserId))).limit(1))[0];
      if (alternateModerator && shouldSelectSecondVerifierAudit()) {
        await tx.insert(verificationAudits).values({ verificationOrderId, primaryModeratorUserId: operatorUserId, status: "selected" });
      }
    }
    return { status: decision, expiresAt };
  });
  await enqueueAndDispatchOwnerAlert(
    decision === "passed" ? "verification_passed" : "verification_failed",
    `VER-${verificationOrderId}`,
    decision === "passed" ? "A Field Moderator recorded a passed physical verification." : "A Field Moderator recorded a failed physical verification.",
  );
  return outcome;
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
  const outcome = await db.transaction(async (tx) => {
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
    if (decision === "approved") {
      await queueMatchAlertDeliveriesForListing(tx, { ...listing, status: "published" });
    }
    if (decision === "rejected") {
      await tx.update(listingCredits).set({ status: "restored", usedForListingId: null, consumedAt: null })
        .where(and(eq(listingCredits.usedForListingId, listingId), eq(listingCredits.status, "consumed")));
    }
    return { status: target };
  });
  if (decision === "approved") {
    await enqueueAndDispatchOwnerAlert("listing_published", listingId, "A listing passed first-publication review and is now public.");
  }
  return outcome;
}

type MatchAlertPreferenceInput = {
  whatsappPhone: string;
  city: "Yaoundé" | "Douala";
  neighborhood?: string;
  minBedrooms?: number;
  maxMonthlyRent?: number;
  maxMoveInCash?: number;
};

/** A preference represents explicit opt-in; delivery remains provider-pending until a licensed WhatsApp Business provider is configured. */
export async function createSeekerMatchAlertPreference(userId: number, input: MatchAlertPreferenceInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: seekerMatchAlertPreferences.id }).from(seekerMatchAlertPreferences)
    .where(eq(seekerMatchAlertPreferences.userId, userId));
  if (existing.length >= 10) throw new Error("Keep up to 10 active or historical match alerts per account.");
  const result = await db.insert(seekerMatchAlertPreferences).values({
    userId,
    whatsappPhone: input.whatsappPhone,
    city: input.city,
    neighborhood: input.neighborhood || null,
    minBedrooms: input.minBedrooms ?? 0,
    maxMonthlyRent: input.maxMonthlyRent ?? null,
    maxMoveInCash: input.maxMoveInCash ?? null,
    active: true,
    consentVersion: "2026-08-13",
    consentedAt: new Date(),
    revokedAt: null,
  });
  return { id: Number(result[0].insertId), active: true };
}

export async function listSeekerMatchAlertPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seekerMatchAlertPreferences)
    .where(eq(seekerMatchAlertPreferences.userId, userId));
}

export async function revokeSeekerMatchAlertPreference(userId: number, preferenceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(seekerMatchAlertPreferences).set({ active: false, revokedAt: new Date() })
    .where(and(eq(seekerMatchAlertPreferences.id, preferenceId), eq(seekerMatchAlertPreferences.userId, userId)));
  return { success: true } as const;
}

export async function listSeekerMatchAlertDeliveries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: matchAlertDeliveries.id,
    status: matchAlertDeliveries.status,
    provider: matchAlertDeliveries.provider,
    queuedAt: matchAlertDeliveries.queuedAt,
    suppressionReason: matchAlertDeliveries.suppressionReason,
    listingId: listings.id,
    title: listings.title,
    city: listings.city,
    neighborhood: listings.neighborhood,
  }).from(matchAlertDeliveries).innerJoin(listings, eq(matchAlertDeliveries.listingId, listings.id))
    .where(eq(matchAlertDeliveries.recipientUserId, userId));
}

async function queueMatchAlertDeliveriesForListing(tx: any, listing: typeof listings.$inferSelect) {
  const costs = (await tx.select().from(listingCosts).where(eq(listingCosts.listingId, listing.id)).limit(1))[0];
  if (!costs) return;
  const totalMoveInCash = calculateTotalMoveInCash(costs);
  const preferences = await tx.select().from(seekerMatchAlertPreferences)
    .where(and(eq(seekerMatchAlertPreferences.active, true), eq(seekerMatchAlertPreferences.city, listing.city)));
  const matches = preferences.filter((preference: typeof seekerMatchAlertPreferences.$inferSelect) => {
    const neighborhoodMatches = !preference.neighborhood || preference.neighborhood.trim().toLowerCase() === listing.neighborhood.trim().toLowerCase();
    const bedroomMatches = listing.bedrooms >= preference.minBedrooms;
    const rentMatches = !preference.maxMonthlyRent || costs.monthlyRent <= preference.maxMonthlyRent;
    const cashMatches = !preference.maxMoveInCash || totalMoveInCash <= preference.maxMoveInCash;
    return neighborhoodMatches && bedroomMatches && rentMatches && cashMatches;
  });
  for (const preference of matches) {
    await tx.insert(matchAlertDeliveries).values({
      preferenceId: preference.id,
      listingId: listing.id,
      recipientUserId: preference.userId,
      status: "provider_pending",
      provider: "unconfigured",
      suppressionReason: "Awaiting approved WhatsApp Business provider configuration.",
      queuedAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: { status: "provider_pending", provider: "unconfigured", suppressionReason: "Awaiting approved WhatsApp Business provider configuration." },
    });
  }
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
