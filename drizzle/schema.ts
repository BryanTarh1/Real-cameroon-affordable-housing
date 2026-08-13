import {
  boolean,
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table. The OAuth identity stays authoritative while the role supports
 * public seekers and AHC operational roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "moderator", "admin"]).default("user").notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  bannedAt: timestamp("bannedAt"),
  bannedByUserId: int("bannedByUserId"),
  banReason: text("banReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * AHC-owned credentials for agent accounts. Staff can continue using their
 * existing trusted identity while local agents no longer depend on Manus login.
 * Passwords are stored only as salted, memory-hard hashes; this table never
 * stores a plaintext password or a recoverable secret.
 */
export const localCredentials = mysqlTable("local_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastPasswordChangedAt: timestamp("lastPasswordChangedAt").defaultNow().notNull(),
}, (table) => [index("local_credentials_locked_idx").on(table.lockedUntil)]);

/** Public and contact profile for an agent. Phone is normalized before any wa.me link is generated. */
export const agentProfiles = mysqlTable("agent_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  publicName: varchar("publicName", { length: 100 }).notNull(),
  agencyName: varchar("agencyName", { length: 120 }),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }).notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["access", "growth", "agency"]).default("access").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["pending_payment", "active", "past_due", "suspended", "expired"]).default("pending_payment").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A trusted operational reviewer. Creating or suspending moderators remains an admin-only action. */
export const moderatorProfiles = mysqlTable("moderator_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  cityCoverage: varchar("cityCoverage", { length: 100 }),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Private supply-side application. Self-registration never grants Owner, Moderator, or Admin authority. */
export const onboardingApplications = mysqlTable("onboarding_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicantType: mysqlEnum("applicantType", ["agent", "owner"]).notNull(),
  status: mysqlEnum("status", ["submitted", "approved", "changes_requested", "rejected"]).default("submitted").notNull(),
  governmentIdUrl: text("governmentIdUrl").notNull(),
  workProofUrl: text("workProofUrl"),
  landTitleUrl: text("landTitleUrl"),
  occupancyRightUrl: text("occupancyRightUrl"),
  supportingDocumentUrl: text("supportingDocumentUrl"),
  reviewNote: text("reviewNote"),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("onboarding_applications_user_idx").on(table.userId, table.status)]);

/** Singleton platform configuration. Only administrators can adjust commercial rules. */
export const platformSettings = mysqlTable("platform_settings", {
  id: int("id").primaryKey(),
  agentAccessFeeXaf: int("agentAccessFeeXaf").default(3_000).notNull(),
  listingPassFeeXaf: int("listingPassFeeXaf").default(1_000).notNull(),
  featuredPinFeeXaf: int("featuredPinFeeXaf").default(3_000).notNull(),
  physicalVerificationFeeXaf: int("physicalVerificationFeeXaf").default(7_500).notNull(),
  fieldModeratorShareBps: int("fieldModeratorShareBps").default(8_000).notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Immutable record of administrator actions affecting trust, access, or commercial rules. */
export const adminAuditEvents = mysqlTable("admin_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["settings_updated", "user_banned", "user_unbanned", "role_changed"]).notNull(),
  actorUserId: int("actorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: int("targetUserId").references(() => users.id, { onDelete: "set null" }),
  details: text("details").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("admin_audit_events_created_idx").on(table.createdAt)]);

/**
 * Public rental inventory. Internal exact coordinates are intentionally not stored
 * in the first release; public coordinates are approximate landmark points only.
 */
export const listings = mysqlTable("listings", {
  id: varchar("id", { length: 32 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  landmark: text("landmark").notNull(),
  propertyType: varchar("propertyType", { length: 50 }).notNull(),
  householdFit: varchar("householdFit", { length: 80 }),
  availableFrom: date("availableFrom").notNull(),
  status: mysqlEnum("status", ["draft", "under_review", "changes_requested", "rejected", "published", "needs_reconfirmation", "suspended", "archived"]).default("under_review").notNull(),
  agentUserId: int("agentUserId").references(() => users.id, { onDelete: "set null" }),
  agentNameSnapshot: varchar("agentNameSnapshot", { length: 100 }).notNull(),
  lastReconfirmed: timestamp("lastReconfirmed").defaultNow().notNull(),
  freshnessWindowDays: int("freshnessWindowDays").default(14).notNull(),
  publicLatitude: decimal("publicLatitude", { precision: 10, scale: 7 }).notNull(),
  publicLongitude: decimal("publicLongitude", { precision: 10, scale: 7 }).notNull(),
  mapRadiusM: int("mapRadiusM").default(300).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  featuredUntil: timestamp("featuredUntil"),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "remote_checked", "physical_verified"]).default("unverified").notNull(),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
  photosCount: int("photosCount").default(0).notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewSummary: text("reviewSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("listings_public_search_idx").on(table.status, table.city, table.lastReconfirmed),
  index("listings_agent_idx").on(table.agentUserId, table.status),
  index("listings_featured_idx").on(table.isFeatured, table.featuredUntil),
]);

/**
 * All values are XAF. A known zero is distinct from a missing value: every component
 * is required to support a transparent Total Move-In Cash Required calculation.
 */
export const listingCosts = mysqlTable("listing_costs", {
  listingId: varchar("listingId", { length: 32 }).primaryKey().references(() => listings.id, { onDelete: "cascade" }),
  monthlyRent: int("monthlyRent").notNull(),
  advanceMonths: int("advanceMonths").default(1).notNull(),
  securityDeposit: int("securityDeposit").default(0).notNull(),
  agencyFee: int("agencyFee").default(0).notNull(),
  serviceFee: int("serviceFee").default(0).notNull(),
  firstMonthUtilities: int("firstMonthUtilities").default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("XAF").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Monetization record for time-bounded featured map pins. */
export const listingPromotions = mysqlTable("listing_promotions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["featured_pin"]).default("featured_pin").notNull(),
  status: mysqlEnum("status", ["pending", "active", "expired", "cancelled"]).default("pending").notNull(),
  amountXaf: int("amountXaf").notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  providerReference: varchar("providerReference", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("listing_promotions_listing_idx").on(table.listingId, table.status)]);

/**
 * Paid orders are reconciled by operations until a licensed merchant integration is configured.
 * Entering a transaction reference alone never activates a paid product.
 */
export const paymentOrders = mysqlTable("payment_orders", {
  id: varchar("id", { length: 32 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listingId", { length: 32 }).references(() => listings.id, { onDelete: "set null" }),
  type: mysqlEnum("type", ["agent_access", "listing_pass", "featured_pin", "physical_verification"]).notNull(),
  status: mysqlEnum("status", ["awaiting_reference", "reference_submitted", "confirmed", "rejected", "expired", "cancelled"]).default("awaiting_reference").notNull(),
  amountXaf: int("amountXaf").notNull(),
  provider: mysqlEnum("provider", ["mtn_momo", "orange_money", "other"]).default("mtn_momo").notNull(),
  providerReference: varchar("providerReference", { length: 120 }),
  submittedAt: timestamp("submittedAt"),
  reconciledAt: timestamp("reconciledAt"),
  reconciledByUserId: int("reconciledByUserId").references(() => users.id, { onDelete: "set null" }),
  reconciliationNote: text("reconciliationNote"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("payment_orders_queue_idx").on(table.status, table.type, table.createdAt),
  index("payment_orders_user_idx").on(table.userId, table.status),
]);

/** A reconciled payment creates a controlled, single-use right to submit a new listing. */
export const listingCredits = mysqlTable("listing_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentOrderId: varchar("paymentOrderId", { length: 32 }).references(() => paymentOrders.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["available", "consumed", "restored", "expired"]).default("available").notNull(),
  usedForListingId: varchar("usedForListingId", { length: 32 }).references(() => listings.id, { onDelete: "set null" }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  consumedAt: timestamp("consumedAt"),
}, (table) => [index("listing_credits_user_idx").on(table.userId, table.status)]);

/** Immutable event log for reviewer assignments, decisions, and resulting listing states. */
export const listingReviewEvents = mysqlTable("listing_review_events", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["submitted", "assigned", "approved", "changes_requested", "rejected", "resubmitted", "suspended", "archived"]).notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  reason: text("reason"),
  actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
  assignedModeratorUserId: int("assignedModeratorUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("listing_review_events_queue_idx").on(table.listingId, table.createdAt)]);

/** Paid field-verification request and evidence status, independent from the public badge. */
export const verificationOrders = mysqlTable("verification_orders", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  requestedByUserId: int("requestedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedModeratorUserId: int("assignedModeratorUserId").references(() => users.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["pending_payment", "paid", "scheduled", "passed", "failed", "cancelled"]).default("pending_payment").notNull(),
  amountXaf: int("amountXaf").notNull(),
  evidenceNote: text("evidenceNote"),
  verifiedAt: timestamp("verifiedAt"),
  expiresAt: timestamp("expiresAt"),
  providerReference: varchar("providerReference", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("verification_orders_listing_idx").on(table.listingId, table.status)]);

/** Immutable accountability trail for paid physical verification activity and field outcomes. */
export const verificationEvents = mysqlTable("verification_events", {
  id: int("id").autoincrement().primaryKey(),
  verificationOrderId: int("verificationOrderId").notNull().references(() => verificationOrders.id, { onDelete: "cascade" }),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["assigned", "scheduled", "passed", "failed", "cancelled"]).notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  reason: text("reason").notNull(),
  actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
  assignedModeratorUserId: int("assignedModeratorUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("verification_events_order_idx").on(table.verificationOrderId, table.createdAt)]);

/** Private structured visit proof retained for staff accountability and never returned by public listing queries. */
export const verificationEvidence = mysqlTable("verification_evidence", {
  id: int("id").autoincrement().primaryKey(),
  verificationOrderId: int("verificationOrderId").notNull().references(() => verificationOrders.id, { onDelete: "cascade" }),
  capturedByUserId: int("capturedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["exterior", "interior", "bathroom", "document", "other"]).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  listingMatch: mysqlEnum("listingMatch", ["matches", "partially_matches", "does_not_match"]).notNull(),
  observation: text("observation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("verification_evidence_order_idx").on(table.verificationOrderId, table.createdAt)]);

/** Allocations earned only after a Field Moderator records a passed physical verification. */
export const fieldVerificationCommissions = mysqlTable("field_verification_commissions", {
  id: int("id").autoincrement().primaryKey(),
  verificationOrderId: int("verificationOrderId").notNull().unique().references(() => verificationOrders.id, { onDelete: "cascade" }),
  moderatorUserId: int("moderatorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  grossAmountXaf: int("grossAmountXaf").notNull(),
  fieldModeratorAmountXaf: int("fieldModeratorAmountXaf").notNull(),
  platformAmountXaf: int("platformAmountXaf").notNull(),
  fieldModeratorShareBps: int("fieldModeratorShareBps").notNull(),
  status: mysqlEnum("status", ["accrued", "paid", "voided"]).default("accrued").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("field_verification_commissions_moderator_idx").on(table.moderatorUserId, table.status)]);

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  reporterUserId: int("reporterUserId").references(() => users.id, { onDelete: "set null" }),
  reason: mysqlEnum("reason", ["inaccurate_cost", "unavailable", "misleading_details", "other"]).default("other").notNull(),
  note: text("note").notNull(),
  status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
  filedAt: timestamp("filedAt").defaultNow().notNull(),
}, (table) => [
  index("reports_listing_idx").on(table.listingId, table.status),
  uniqueIndex("reports_distinct_reporter_idx").on(table.listingId, table.reporterUserId),
]);

/**
 * A privacy-minimised record of an authenticated seeker's decision to open a
 * listing's WhatsApp contact route. It records intent, not messages, location,
 * contact content, or a claimed conversion.
 */
export const leadEvents = mysqlTable("lead_events", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  seekerUserId: int("seekerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactUserId: int("contactUserId").references(() => users.id, { onDelete: "set null" }),
  channel: mysqlEnum("channel", ["whatsapp"]).default("whatsapp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("lead_events_listing_idx").on(table.listingId, table.createdAt),
  index("lead_events_contact_idx").on(table.contactUserId, table.createdAt),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type ListingCost = typeof listingCosts.$inferSelect;
