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
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Public and contact profile for an agent. Phone is normalized before any wa.me link is generated. */
export const agentProfiles = mysqlTable("agent_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  publicName: varchar("publicName", { length: 100 }).notNull(),
  agencyName: varchar("agencyName", { length: 120 }),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }).notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "starter", "pro"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "past_due", "paused", "expired"]).default("active").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
  status: mysqlEnum("status", ["draft", "under_review", "published", "needs_reconfirmation", "suspended", "archived"]).default("under_review").notNull(),
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

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  listingId: varchar("listingId", { length: 32 }).notNull().references(() => listings.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
  filedAt: timestamp("filedAt").defaultNow().notNull(),
}, (table) => [index("reports_listing_idx").on(table.listingId, table.status)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type ListingCost = typeof listingCosts.$inferSelect;
