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
  /** Private object key. A signed URL is resolved only for the owning customer. */
  profileImageStorageKey: text("profileImageStorageKey"),
  /** Preferences are stored now; no email is dispatched until a provider is configured. */
  emailAccountUpdatesEnabled: boolean("emailAccountUpdatesEnabled").default(true).notNull(),
  emailMatchAlertsEnabled: boolean("emailMatchAlertsEnabled").default(false).notNull(),
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
  /** Set once, on confirmed first-month Welcome Bundle reconciliation. */
  welcomeBundleUsedAt: timestamp("welcomeBundleUsedAt"),
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
  /** Legacy reference retained for compatibility; new onboarding stores private JPG keys below. */
  governmentIdUrl: text("governmentIdUrl"),
  taxpayerNumber: varchar("taxpayerNumber", { length: 80 }),
  governmentIdFrontStorageKey: text("governmentIdFrontStorageKey"),
  governmentIdBackStorageKey: text("governmentIdBackStorageKey"),
  governmentIdFaceStorageKey: text("governmentIdFaceStorageKey"),
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
  /** Welcome Bundle fee; retained column name preserves the original migration history. */
  agentAccessFeeXaf: int("agentAccessFeeXaf").default(3_000).notNull(),
  /** Retained only for historic Listing Pass receipts during the pricing transition. */
  listingPassFeeXaf: int("listingPassFeeXaf").default(1_000).notNull(),
  starterAccessFeeXaf: int("starterAccessFeeXaf").default(10_000).notNull(),
  proAccessFeeXaf: int("proAccessFeeXaf").default(25_000).notNull(),
  featuredPinFeeXaf: int("featuredPinFeeXaf").default(2_500).notNull(),
  routeBatchVerificationFeeXaf: int("routeBatchVerificationFeeXaf").default(5_000).notNull(),
  physicalVerificationFeeXaf: int("physicalVerificationFeeXaf").default(7_500).notNull(),
  fieldModeratorShareBps: int("fieldModeratorShareBps").default(8_000).notNull(),
  /** Owner-only operational notifications may be paused without deleting their audit trail. */
  ownerAlertsEnabled: boolean("ownerAlertsEnabled").default(true).notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Immutable record of administrator actions affecting trust, access, or commercial rules. */
export const adminAuditEvents = mysqlTable("admin_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["settings_updated", "user_banned", "user_unbanned", "role_changed", "onboarding_reviewed"]).notNull(),
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
  /** A declaration, never an inferred amenity claim. Existing records remain explicitly not stated. */
  furnishingStatus: mysqlEnum("furnishingStatus", ["not_stated", "unfurnished", "partly_furnished", "fully_furnished"]).default("not_stated").notNull(),
  bedrooms: int("bedrooms").default(0).notNull(),
  householdFit: varchar("householdFit", { length: 80 }),
  availableFrom: date("availableFrom").notNull(),
  status: mysqlEnum("status", ["draft", "under_review", "changes_requested", "rejected", "published", "needs_reconfirmation", "suspended", "archived"]).default("under_review").notNull(),
  supplyCapacity: mysqlEnum("supplyCapacity", ["agent_representative", "direct_owner"]).default("agent_representative").notNull(),
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

/** An immutable, seeker-visible ledger of public cost changes and the Agent's stated reason. */
export const listingPriceHistory = mysqlTable("listing_price_history", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  previousMonthlyRent: int("previousMonthlyRent").notNull(),
  previousAdvanceMonths: int("previousAdvanceMonths").notNull(),
  previousSecurityDeposit: int("previousSecurityDeposit").notNull(),
  previousAgencyFee: int("previousAgencyFee").notNull(),
  previousServiceFee: int("previousServiceFee").notNull(),
  previousFirstMonthUtilities: int("previousFirstMonthUtilities").notNull(),
  monthlyRent: int("monthlyRent").notNull(),
  advanceMonths: int("advanceMonths").notNull(),
  securityDeposit: int("securityDeposit").notNull(),
  agencyFee: int("agencyFee").notNull(),
  serviceFee: int("serviceFee").notNull(),
  firstMonthUtilities: int("firstMonthUtilities").notNull(),
  changeReason: varchar("changeReason", { length: 500 }).notNull(),
  changedByUserId: int("changedByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("listing_price_history_listing_idx").on(table.listingId, table.createdAt)]);

/** A private, non-punitive review queue for pairs of supply that may be duplicates. */
export const duplicateListingReviews = mysqlTable("duplicate_listing_reviews", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  candidateListingId: varchar("candidateListingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  confidenceScore: int("confidenceScore").notNull(),
  signalSummary: varchar("signalSummary", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["open", "dismissed", "confirmed_duplicate"]).default("open").notNull(),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("duplicate_listing_pair_idx").on(table.listingId, table.candidateListingId),
  index("duplicate_listing_review_queue_idx").on(table.status, table.createdAt),
]);

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
  type: mysqlEnum("type", ["agent_access", "listing_pass", "featured_pin", "physical_verification", "welcome_bundle", "starter_access", "pro_access", "physical_verification_route_batch", "physical_verification_individual"]).notNull(),
  status: mysqlEnum("status", ["awaiting_reference", "reference_submitted", "confirmed", "rejected", "expired", "cancelled"]).default("awaiting_reference").notNull(),
  amountXaf: int("amountXaf").notNull(),
  provider: mysqlEnum("provider", ["mtn_momo", "orange_money", "other"]).default("mtn_momo").notNull(),
  providerReference: varchar("providerReference", { length: 120 }),
  submittedAt: timestamp("submittedAt"),
  reconciledAt: timestamp("reconciledAt"),
  reconciledByUserId: int("reconciledByUserId").references(() => users.id, { onDelete: "set null" }),
  reconciliationNote: text("reconciliationNote"),
  /** Issued only after staff reconciliation; it is the canonical AHC fee receipt identifier. */
  officialReceiptCode: varchar("officialReceiptCode", { length: 48 }).unique(),
  receiptIssuedAt: timestamp("receiptIssuedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("payment_orders_queue_idx").on(table.status, table.type, table.createdAt),
  index("payment_orders_user_idx").on(table.userId, table.status),
  /** Prevents the same Mobile Money transaction reference from funding two AHC services. */
  uniqueIndex("payment_orders_provider_reference_unique").on(table.provider, table.providerReference),
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
  action: mysqlEnum("action", ["submitted", "assigned", "approved", "changes_requested", "rejected", "resubmitted", "suspended", "released", "archived"]).notNull(),
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
  serviceType: mysqlEnum("serviceType", ["route_batch", "individual"]).default("individual").notNull(),
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

/**
 * A moderator-captured, short vertical viewing clip. It becomes public only after
 * the linked field visit has passed and the listing itself remains published.
 * The storage key is retained for staff accountability; public searches receive
 * only the published media URL.
 */
export const listingWalkthroughVideos = mysqlTable("listing_walkthrough_videos", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().unique().references(() => listings.id, { onDelete: "cascade" }),
  verificationOrderId: int("verificationOrderId").notNull().unique().references(() => verificationOrders.id, { onDelete: "cascade" }),
  capturedByUserId: int("capturedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  storageKey: text("storageKey").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  orientation: mysqlEnum("orientation", ["vertical", "other"]).default("vertical").notNull(),
  listingMatch: mysqlEnum("listingMatch", ["matches", "partially_matches", "does_not_match"]).notNull(),
  status: mysqlEnum("status", ["captured", "published", "withheld"]).default("captured").notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => [index("listing_walkthroughs_public_idx").on(table.status, table.listingId)]);

/**
 * Structured, time-bound Field Moderator observations for everyday access. These
 * are observations from the visit, not absolute infrastructure guarantees or
 * exact-address disclosure.
 */
export const listingNeighborhoodAssessments = mysqlTable("listing_neighborhood_assessments", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().unique().references(() => listings.id, { onDelete: "cascade" }),
  verificationOrderId: int("verificationOrderId").notNull().unique().references(() => verificationOrders.id, { onDelete: "cascade" }),
  assessedByUserId: int("assessedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  waterAccess: mysqlEnum("waterAccess", ["borehole_on_site", "water_storage_seen", "public_network_observed", "not_confirmed"]).default("not_confirmed").notNull(),
  powerReliability: mysqlEnum("powerReliability", ["backup_seen", "prepaid_meter_seen", "local_low_outage_assessment", "local_outage_caution", "not_confirmed"]).default("not_confirmed").notNull(),
  roadAccess: mysqlEnum("roadAccess", ["tarred_to_gate", "tarred_nearby", "dirt_track_to_gate", "not_confirmed"]).default("not_confirmed").notNull(),
  taxiWalkMinutes: int("taxiWalkMinutes"),
  junctionName: varchar("junctionName", { length: 100 }),
  junctionMinutes: int("junctionMinutes"),
  observationNote: text("observationNote").notNull(),
  assessedAt: timestamp("assessedAt").defaultNow().notNull(),
}, (table) => [index("listing_neighborhood_assessments_listing_idx").on(table.listingId)]);

/**
 * A seeker's consented criteria for a future property notice. Phone numbers are
 * not exposed in public search or Agent views and consent can be withdrawn.
 */
export const seekerMatchAlertPreferences = mysqlTable("seeker_match_alert_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }),
  minBedrooms: int("minBedrooms").default(0).notNull(),
  maxMonthlyRent: int("maxMonthlyRent"),
  maxMoveInCash: int("maxMoveInCash"),
  active: boolean("active").default(true).notNull(),
  consentVersion: varchar("consentVersion", { length: 32 }).default("2026-08-13").notNull(),
  consentedAt: timestamp("consentedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("seeker_match_alert_preferences_user_idx").on(table.userId, table.active)]);

/**
 * One auditable potential alert per matching preference and approved listing.
 * Provider states describe delivery only and never imply a response, viewing, or
 * tenancy conversion.
 */
export const matchAlertDeliveries = mysqlTable("match_alert_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  preferenceId: int("preferenceId").notNull().references(() => seekerMatchAlertPreferences.id, { onDelete: "cascade" }),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  recipientUserId: int("recipientUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["provider_pending", "queued", "sent", "delivered", "read", "failed", "suppressed"]).default("provider_pending").notNull(),
  provider: varchar("provider", { length: 64 }).default("unconfigured").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 160 }),
  suppressionReason: text("suppressionReason"),
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  failedAt: timestamp("failedAt"),
}, (table) => [
  uniqueIndex("match_alert_deliveries_preference_listing_idx").on(table.preferenceId, table.listingId),
  index("match_alert_deliveries_status_idx").on(table.status, table.queuedAt),
  index("match_alert_deliveries_user_idx").on(table.recipientUserId, table.queuedAt),
]);

/**
 * A delivery-audited, owner-only operational alert. Message text never contains
 * payment references, tenancy money, exact addresses, contact details, or proof.
 * `dedupeKey` makes durable business outcomes safe against duplicate dispatches.
 */
export const ownerAlertOutbox = mysqlTable("owner_alert_outbox", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", [
    "payment_confirmed", "payment_rejected", "verification_passed", "verification_failed",
    "safety_hold_applied", "safety_hold_released", "listing_published", "announcement",
  ]).notNull(),
  referenceId: varchar("referenceId", { length: 96 }).notNull(),
  /** Private Admin-readable context, limited to a non-sensitive operational summary. */
  summary: varchar("summary", { length: 500 }).notNull(),
  dedupeKey: varchar("dedupeKey", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "read", "failed", "suppressed"]).default("queued").notNull(),
  provider: varchar("provider", { length: 64 }).default("unconfigured").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 160 }),
  attemptCount: int("attemptCount").default(0).notNull(),
  failureReason: text("failureReason"),
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  failedAt: timestamp("failedAt"),
}, (table) => [
  uniqueIndex("owner_alert_outbox_dedupe_idx").on(table.dedupeKey),
  uniqueIndex("owner_alert_outbox_provider_message_idx").on(table.providerMessageId),
  index("owner_alert_outbox_status_idx").on(table.status, table.queuedAt),
]);

/**
 * A statistically selected, independent second field visit. It is private to
 * authorised staff and prevents the first Field Moderator from auditing their
 * own result or releasing their commission without the second visit resolving.
 */
export const verificationAudits = mysqlTable("verification_audits", {
  id: int("id").autoincrement().primaryKey(),
  verificationOrderId: int("verificationOrderId").notNull().unique().references(() => verificationOrders.id, { onDelete: "cascade" }),
  primaryModeratorUserId: int("primaryModeratorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  auditorUserId: int("auditorUserId").references(() => users.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["selected", "claimed", "confirmed", "disputed", "cancelled"]).default("selected").notNull(),
  listingMatch: mysqlEnum("listingMatch", ["matches", "partially_matches", "does_not_match"]),
  exteriorProofUrl: text("exteriorProofUrl"),
  supportingProofUrl: text("supportingProofUrl"),
  observation: text("observation"),
  selectedAt: timestamp("selectedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [
  index("verification_audits_status_idx").on(table.status, table.selectedAt),
  index("verification_audits_auditor_idx").on(table.auditorUserId, table.status),
]);

/** Allocations earned only after a Field Moderator records a passed physical verification. */
export const fieldVerificationCommissions = mysqlTable("field_verification_commissions", {
  id: int("id").autoincrement().primaryKey(),
  verificationOrderId: int("verificationOrderId").notNull().unique().references(() => verificationOrders.id, { onDelete: "cascade" }),
  moderatorUserId: int("moderatorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  grossAmountXaf: int("grossAmountXaf").notNull(),
  fieldModeratorAmountXaf: int("fieldModeratorAmountXaf").notNull(),
  platformAmountXaf: int("platformAmountXaf").notNull(),
  fieldModeratorShareBps: int("fieldModeratorShareBps").notNull(),
  /** Held records are not payable until an Admin reviews the saved field evidence. */
  status: mysqlEnum("status", ["held", "accrued", "paid", "voided"]).default("held").notNull(),
  evidenceReviewedAt: timestamp("evidenceReviewedAt"),
  evidenceReviewedByUserId: int("evidenceReviewedByUserId").references(() => users.id, { onDelete: "set null" }),
  evidenceReviewNote: text("evidenceReviewNote"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("field_verification_commissions_moderator_idx").on(table.moderatorUserId, table.status)]);

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  reporterUserId: int("reporterUserId").references(() => users.id, { onDelete: "set null" }),
  /** Keyed server-side fingerprint for clustered-report review; raw IP addresses are never retained. */
  reporterNetworkFingerprint: varchar("reporterNetworkFingerprint", { length: 96 }),
  reason: mysqlEnum("reason", ["inaccurate_cost", "unavailable", "misleading_details", "unofficial_fee", "unsafe_meeting", "duplicate_listing", "other"]).default("other").notNull(),
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

/** A private seeker-owned shortlist. Entries expose no contacts or exact directions. */
export const savedListings = mysqlTable("saved_listings", {
  id: int("id").autoincrement().primaryKey(),
  seekerUserId: int("seekerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("saved_listings_seeker_listing_idx").on(table.seekerUserId, table.listingId),
  index("saved_listings_seeker_created_idx").on(table.seekerUserId, table.createdAt),
]);

/** Private, compact record of listings an authenticated customer has opened. */
export const listingViewHistory = mysqlTable("listing_view_history", {
  id: int("id").autoincrement().primaryKey(),
  seekerUserId: int("seekerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  viewCount: int("viewCount").default(1).notNull(),
  firstViewedAt: timestamp("firstViewedAt").defaultNow().notNull(),
  lastViewedAt: timestamp("lastViewedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("listing_view_history_seeker_listing_idx").on(table.seekerUserId, table.listingId),
  index("listing_view_history_seeker_recent_idx").on(table.seekerUserId, table.lastViewedAt),
]);

/** An Agent-owned time window. A slot reserves for one pending viewing request at a time. */
export const viewingSlots = mysqlTable("viewing_slots", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  agentUserId: int("agentUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  status: mysqlEnum("status", ["open", "reserved", "cancelled", "expired"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("viewing_slots_listing_idx").on(table.listingId, table.status, table.startsAt),
  index("viewing_slots_agent_idx").on(table.agentUserId, table.status, table.startsAt),
]);

/**
 * A private request to view a physically verified, live listing. Exact-property
 * directions are deliberately absent: the Agent receives the seeker contact only
 * after accepting the request, and meeting logistics remain off the public record.
 */
export const viewingAppointments = mysqlTable("viewing_appointments", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  slotId: int("slotId").references(() => viewingSlots.id, { onDelete: "set null" }),
  seekerUserId: int("seekerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentUserId: int("agentUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestedStart: timestamp("requestedStart").notNull(),
  requestedEnd: timestamp("requestedEnd").notNull(),
  contactPreference: mysqlEnum("contactPreference", ["whatsapp", "phone"]).default("whatsapp").notNull(),
  privateContact: varchar("privateContact", { length: 20 }).notNull(),
  seekerNote: text("seekerNote"),
  agentNote: text("agentNote"),
  status: mysqlEnum("status", ["requested", "confirmed", "declined", "cancelled", "completed", "no_show", "expired"]).default("requested").notNull(),
  /** A request needs a fresh Agent confirmation within forty-eight hours. */
  availabilityStatus: mysqlEnum("availabilityStatus", ["pending", "confirmed", "expired"]).default("pending").notNull(),
  availabilityConfirmationDueAt: timestamp("availabilityConfirmationDueAt").notNull(),
  availabilityConfirmedAt: timestamp("availabilityConfirmedAt"),
  respondedAt: timestamp("respondedAt"),
  cancelledAt: timestamp("cancelledAt"),
  outcomeRecordedAt: timestamp("outcomeRecordedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("viewing_appointments_listing_idx").on(table.listingId, table.status, table.requestedStart),
  index("viewing_appointments_seeker_idx").on(table.seekerUserId, table.status, table.requestedStart),
  index("viewing_appointments_agent_idx").on(table.agentUserId, table.status, table.requestedStart),
  index("viewing_appointments_availability_idx").on(table.availabilityStatus, table.availabilityConfirmationDueAt),
]);

/** Immutable, role-attributed record of every permitted appointment state change. */
export const viewingAppointmentEvents = mysqlTable("viewing_appointment_events", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull().references(() => viewingAppointments.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["requested", "confirmed", "declined", "cancelled_by_seeker", "cancelled_by_agent", "completed", "no_show", "expired"]).notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("viewing_appointment_events_idx").on(table.appointmentId, table.createdAt),
]);

/** Private structured feedback after a viewing, not a public star rating or testimonial. */
export const viewingAppointmentSeekerOutcomes = mysqlTable("viewing_appointment_seeker_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull().unique().references(() => viewingAppointments.id, { onDelete: "cascade" }),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  seekerUserId: int("seekerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  outcome: mysqlEnum("outcome", ["matched_listing", "price_differed", "already_rented", "did_not_attend"]).notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("viewing_outcomes_listing_idx").on(table.listingId, table.outcome, table.createdAt),
  index("viewing_outcomes_seeker_idx").on(table.seekerUserId, table.createdAt),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type ListingCost = typeof listingCosts.$inferSelect;
