import { TRPCError } from "@trpc/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { AHC_LOCAL_SESSION_COOKIE, AHC_LOCAL_SESSION_MAX_AGE_MS, COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { createLocalSessionToken, hashLocalPassword, isLegacyScryptPasswordHash, verifyLocalPassword } from "./_core/localAuth";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, agentWorkspaceProcedure, moderatorProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  assignListingReview,
  approveHeldCommission,
  archiveStaleListings,
  clearLocalLoginFailures,
  cancelAgentViewingSlot,
  confirmPurchaseFromViewing,
  createAgentViewingSlot,
  createAgentReview,
  createSeekerMatchAlertPreference,
  createLocalAgentAccount,
  createViewingAppointment,
  createPaymentOrder,
  createListing,
  createListingReport,
  createPromotionRequest,
  createWhatsAppLeadEvent,
  decideListingReview,
  decideVerificationOrder,
  getAdminCashFlowAudit,
  getAdminPilotSummary,
  getAdminWeeklyPilotActivity,
  getAdminOfficialServiceReceipt,
  getAgentPaidStatus,
  getAgentOfficialServiceReceipt,
  getAgentProfile,
  getCustomerDashboard,
  clearCustomerProfileImageKey,
  markSeekerReportReviewUpdateRead,
  moderateAgentReview,
  listCustomerBrowsingHistory,
  getAgentQualityDashboard,
  getAgentIdentityStatus,
  getOwnerAlertProviderStatus,
  getLocalCredentialByEmail,
  notifyOwnerOfStaffSignIn,
  getPlatformSettings,
  getPublicListingContact,
  listAgentListings,
  listAgentPaymentOrders,
  listAdminUsers,
  listAdminCommissionLedger,
  listAdminLeadEvents,
  listAdminPurchaseConfirmationCandidates,
  listAdminTrustReports,
  listFieldModeratorCommissions,
  listFreshPublicListings,
  listRelatedPublicListings,
  listOperationsPaymentQueue,
  listOperationsReviewQueue,
  listModeratorVerificationBatches,
  listOperationsVerificationEvidence,
  listOperationsVerificationQueue,
  listOwnerAlerts,
  listApprovedAgentReviews,
  listConfirmedPurchasesForSeeker,
  listPendingAgentReviews,
  listVerificationAuditQueue,
  listReviewHistory,
  listSeekerMatchAlertDeliveries,
  listSeekerMatchAlertPreferences,
  listSeekerSavedListings,
  listSeekerViewingSlots,
  listSeekerViewingAppointments,
  listAgentViewingAppointments,
  listAgentViewingSlots,
  listAdminViewingAppointments,
  listDuplicateListingReviews,
  listSeekerVisiblePriceHistory,
  claimVerificationOrder,
  claimVerificationAudit,
  completeVerificationAudit,
  reconfirmAgentListing,
  reconfirmViewingAppointmentAvailability,
  reconcilePaymentOrder,
  releaseListingSafetyHold,
  resolveTrustReport,
  recordLocalLoginFailure,
  removeSeekerSavedListing,
  requestViewingSlot,
  saveSeekerListing,
  submitPaymentReference,
  setUserBan,
  setUserRole,
  revokeSeekerMatchAlertPreference,
  respondToViewingAppointment,
  cancelViewingAppointment,
  recordViewingAppointmentOutcome,
  recordSeekerViewingOutcome,
  decideDuplicateListingReview,
  updateAgentListingCosts,
  updateCustomerDisplayName,
  updateCustomerNotificationPreferences,
  recordListingView,
  updatePlatformSettings,
  upsertAgentProfile,
  upgradeLocalCredentialPasswordHash,
  createOwnerAlertAnnouncement,
} from "./db";
import { createApproximatePoint, createWhatsAppListingLink, isOwnerAlertStaffSignInRole, normalizeCameroonWhatsAppPhone, type PaidOfferType } from "../shared/ahc";

type NetworkAwareRequest = { headers: { [key: string]: string | string[] | undefined }; socket?: { remoteAddress?: string } };

/** Extracts the proxy-provided client address only for Turnstile validation and keyed fairness review. */
function getRequestIp(request: NetworkAwareRequest) {
  const forwarded = request.headers["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded ?? request.socket?.remoteAddress ?? "").split(",")[0].trim() || undefined;
}

/** Returns a keyed reporting-network signal for fairness review; raw network addresses are never stored. */
function getReportNetworkFingerprint(request: NetworkAwareRequest) {
  if (!ENV.cookieSecret) return null;
  const candidate = getRequestIp(request);
  return candidate ? createHmac("sha256", ENV.cookieSecret).update(candidate).digest("hex") : null;
}

type TurnstileSiteverifyResult = { success?: boolean };

/**
 * Verifies a short-lived, single-use Turnstile token at Cloudflare's server endpoint.
 * This deliberately fails closed when the provider is unavailable or unconfigured.
 */
async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<void> {
  if (!ENV.turnstileSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Security verification is not configured." });
  }

  const body = new URLSearchParams({ secret: ENV.turnstileSecretKey, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let result: TurnstileSiteverifyResult;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    result = await response.json() as TurnstileSiteverifyResult;
    if (!response.ok) throw new Error("Turnstile Siteverify request was rejected.");
  } catch {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Security verification is temporarily unavailable. Please try again." });
  }

  if (!result.success) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Security verification failed. Please complete the challenge and try again." });
  }
}

const costsSchema = z.object({
  monthlyRent: z.number().int().min(1),
  advanceMonths: z.number().int().min(1).max(12),
  securityDeposit: z.number().int().min(0),
  agencyFee: z.number().int().min(0),
  serviceFee: z.number().int().min(0),
  firstMonthUtilities: z.number().int().min(0),
});

const listingSubmissionSchema = z.object({
  title: z.string().trim().min(8).max(255),
  city: z.enum(["Yaoundé", "Douala"]),
  neighborhood: z.string().trim().min(2).max(100),
  landmark: z.string().trim().min(5).max(500),
  propertyType: z.string().trim().min(2).max(50),
  furnishingStatus: z.enum(["unfurnished", "partly_furnished", "fully_furnished"]),
  description: z.string().trim().min(40).max(3_000),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  parkingSpaces: z.number().int().min(0).max(20),
  amenities: z.string().trim().max(500).optional(),
  householdFit: z.string().trim().max(80).optional(),
  availableFrom: z.string().date(),
  landmarkLatitude: z.number().min(2).max(5),
  landmarkLongitude: z.number().min(8).max(13),
  mapRadiusM: z.number().int().min(200).max(500),
  costs: costsSchema,
});

const localAccountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
  role: z.enum(["seeker", "agent"]),
  captchaToken: z.string().min(1).max(2048),
  onboarding: z.object({
    applicantType: z.literal("agent"), taxpayerNumber: z.string().trim().min(4).max(64), governmentIdUrl: z.string().url().optional(), workProofUrl: z.string().url(),
  }).optional(),
});

const localLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
  captchaToken: z.string().min(1).max(2048),
});

const appointmentRequestSchema = z.object({
  listingId: z.string().min(4).max(32),
  requestedStart: z.coerce.date(),
  requestedEnd: z.coerce.date(),
  contactPreference: z.enum(["whatsapp", "phone"]),
  privateContact: z.string().trim().min(8).max(20),
  seekerNote: z.string().trim().min(4).max(500).optional(),
});

function ensureUserId(id: number | undefined): number {
  if (!id) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
  return id;
}

/** Purchaser reviews remain reserved for seeker accounts even when another role has a valid session. */
function ensureSeeker(user: { id?: number; role?: string } | null | undefined): number {
  const userId = ensureUserId(user?.id);
  if (user?.role !== "seeker") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only seeker accounts can submit a verified purchaser review." });
  }
  return userId;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    registerLocalAgent: publicProcedure.input(localAccountSchema).mutation(async ({ ctx, input }) => {
      await verifyTurnstileToken(input.captchaToken, getRequestIp(ctx.req));
      const email = input.email.toLowerCase();
      try {
        const user = await createLocalAgentAccount({
          name: input.name,
          email,
          passwordHash: await hashLocalPassword(input.password),
          role: input.role,
          onboarding: input.onboarding,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(AHC_LOCAL_SESSION_COOKIE, await createLocalSessionToken(user), {
          ...cookieOptions,
          maxAge: AHC_LOCAL_SESSION_MAX_AGE_MS,
        });
        return user;
      } catch (error) {
        if (error instanceof Error && error.message.includes("already exists")) {
          throw new TRPCError({ code: "CONFLICT", message: error.message });
        }
        throw error;
      }
    }),
    loginLocalAgent: publicProcedure.input(localLoginSchema).mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const account = await getLocalCredentialByEmail(email);
      if (account?.credential.lockedUntil && account.credential.lockedUntil > new Date()) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please wait 15 minutes and try again." });
      }
      await verifyTurnstileToken(input.captchaToken, getRequestIp(ctx.req));
      if (!account) {
        await hashLocalPassword(input.password);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
      if (!(await verifyLocalPassword(input.password, account.credential.passwordHash))) {
        await recordLocalLoginFailure(email);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
      if (account.user.isBanned) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This account has been suspended. Contact AHC support." });
      }
      await clearLocalLoginFailures(account.user.id);
      if (isLegacyScryptPasswordHash(account.credential.passwordHash)) {
        await upgradeLocalCredentialPasswordHash(account.user.id, await hashLocalPassword(input.password));
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(AHC_LOCAL_SESSION_COOKIE, await createLocalSessionToken(account.user), {
        ...cookieOptions,
        maxAge: AHC_LOCAL_SESSION_MAX_AGE_MS,
      });
      if (isOwnerAlertStaffSignInRole(account.user.role)) {
        void Promise.resolve(notifyOwnerOfStaffSignIn({ id: account.user.id, role: account.user.role })).catch(error => {
          console.warn("[Owner alerts] Staff sign-in alert could not be queued:", error);
        });
      }
      return account.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(AHC_LOCAL_SESSION_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  account: router({
    dashboard: protectedProcedure.query(({ ctx }) => getCustomerDashboard(ensureUserId(ctx.user?.id))),
    markReportReviewUpdateRead: protectedProcedure.input(z.object({ updateId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => markSeekerReportReviewUpdateRead(ensureUserId(ctx.user?.id), input.updateId)),
    removeProfileImage: protectedProcedure.mutation(({ ctx }) => clearCustomerProfileImageKey(ensureUserId(ctx.user?.id))),
    updateDisplayName: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(100) }))
      .mutation(({ ctx, input }) => updateCustomerDisplayName(ensureUserId(ctx.user?.id), input.name)),
    browsingHistory: protectedProcedure.query(({ ctx }) => listCustomerBrowsingHistory(ensureUserId(ctx.user?.id))),
    recordView: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .mutation(({ ctx, input }) => recordListingView(ensureUserId(ctx.user?.id), input.listingId)),
    updateNotificationPreferences: protectedProcedure.input(z.object({
      emailAccountUpdatesEnabled: z.boolean(),
      emailMatchAlertsEnabled: z.boolean(),
    })).mutation(({ ctx, input }) => updateCustomerNotificationPreferences(ensureUserId(ctx.user?.id), input)),
    officialServiceReceipt: protectedProcedure.input(z.object({ orderId: z.string().min(1) }))
      .query(({ ctx, input }) => getAgentOfficialServiceReceipt(ensureUserId(ctx.user?.id), input.orderId)),
  }),

  marketplace: router({
    search: publicProcedure.input(z.object({
      city: z.string().optional(), search: z.string().trim().max(120).optional(),
      maxMonthlyRent: z.number().int().positive().optional(), maxMoveInCash: z.number().int().positive().optional(),
      verification: z.enum(["any", "physical_verified"]).default("any"),
      propertyType: z.string().trim().max(80).optional(), furnishingStatus: z.enum(["any", "not_stated", "unfurnished", "partly_furnished", "fully_furnished"]).default("any"), neighborhood: z.string().trim().max(100).optional(),
      minBedrooms: z.number().int().min(0).max(20).optional(), availability: z.enum(["any", "available_now"]).default("any"),
    }).optional()).query(async ({ input }) => listFreshPublicListings(input ?? {})),
    related: publicProcedure.input(z.object({
      listingId: z.string().min(4).max(32),
      city: z.string().trim().max(50).optional(),
      propertyType: z.string().trim().max(80).optional(),
      minBedrooms: z.number().int().min(0).max(20).optional(),
      maxMonthlyRent: z.number().int().positive().optional(),
      neighborhood: z.string().trim().max(100).optional(),
    })).query(({ input }) => listRelatedPublicListings(input.listingId, input)),
    getContact: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) })).query(({ input }) => ({
      redirectUrl: `/api/listings/${encodeURIComponent(input.listingId)}/whatsapp`,
    })),
    report: protectedProcedure.input(z.object({
      listingId: z.string().min(4).max(32),
      reason: z.enum(["inaccurate_cost", "unavailable", "misleading_details", "unofficial_fee", "unsafe_meeting", "duplicate_listing", "other"]),
      note: z.string().trim().min(10).max(800),
      captchaToken: z.string().min(1).max(2048),
    })).mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.user?.id);
      await verifyTurnstileToken(input.captchaToken, getRequestIp(ctx.req));
      return createListingReport(userId, input.listingId, input.reason, input.note, getReportNetworkFingerprint(ctx.req));
    }),
    matchAlerts: router({
      list: protectedProcedure.query(({ ctx }) => listSeekerMatchAlertPreferences(ensureUserId(ctx.user?.id))),
      deliveries: protectedProcedure.query(({ ctx }) => listSeekerMatchAlertDeliveries(ensureUserId(ctx.user?.id))),
      create: protectedProcedure.input(z.object({
        whatsappPhone: z.string().trim().min(8).max(30),
        city: z.enum(["Yaoundé", "Douala"]),
        neighborhood: z.string().trim().min(2).max(100).optional(),
        minBedrooms: z.number().int().min(0).max(20).default(0),
        maxMonthlyRent: z.number().int().positive().max(5_000_000).optional(),
        maxMoveInCash: z.number().int().positive().max(20_000_000).optional(),
      })).mutation(({ ctx, input }) => createSeekerMatchAlertPreference(ensureUserId(ctx.user?.id), {
        ...input,
        whatsappPhone: normalizeCameroonWhatsAppPhone(input.whatsappPhone),
      })),
      revoke: protectedProcedure.input(z.object({ preferenceId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => revokeSeekerMatchAlertPreference(ensureUserId(ctx.user?.id), input.preferenceId)),
    }),
    shortlist: router({
      list: protectedProcedure.query(({ ctx }) => listSeekerSavedListings(ensureUserId(ctx.user?.id))),
      save: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
        .mutation(({ ctx, input }) => saveSeekerListing(ensureUserId(ctx.user?.id), input.listingId)),
      remove: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
        .mutation(({ ctx, input }) => removeSeekerSavedListing(ensureUserId(ctx.user?.id), input.listingId)),
    }),
    priceHistory: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .query(({ input }) => listSeekerVisiblePriceHistory(input.listingId)),
    agentReviews: router({
      list: publicProcedure.input(z.object({ agentUserId: z.number().int().positive() }))
        .query(({ input }) => listApprovedAgentReviews(input.agentUserId)),
      canReview: protectedProcedure.input(z.object({ agentUserId: z.number().int().positive().optional() }).optional())
        .query(async ({ ctx, input }) => {
          const seekerUserId = ensureSeeker(ctx.user);
          const eligiblePurchases = await listConfirmedPurchasesForSeeker(seekerUserId);
          const filtered = input?.agentUserId
            ? eligiblePurchases.filter(purchase => purchase.agentUserId === input.agentUserId)
            : eligiblePurchases;
          return { canReview: filtered.some(purchase => purchase.canSubmit), eligiblePurchases: filtered };
        }),
      submit: protectedProcedure.input(z.object({
        confirmedPurchaseId: z.number().int().positive(),
        reviewText: z.string().trim().min(20).max(500),
      })).mutation(({ ctx, input }) => createAgentReview({
        seekerUserId: ensureSeeker(ctx.user),
        confirmedPurchaseId: input.confirmedPurchaseId,
        reviewText: input.reviewText,
      })),
    }),
    appointments: router({
      mine: protectedProcedure.query(({ ctx }) => listSeekerViewingAppointments(ensureUserId(ctx.user?.id))),
      availableSlots: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
        .query(({ input }) => listSeekerViewingSlots(input.listingId)),
      requestSlot: protectedProcedure.input(z.object({
        slotId: z.number().int().positive(),
        contactPreference: z.enum(["whatsapp", "phone"]),
        privateContact: z.string().trim().min(8).max(30),
        seekerNote: z.string().trim().max(500).optional(),
      })).mutation(({ ctx, input }) => requestViewingSlot({ seekerUserId: ensureUserId(ctx.user?.id), ...input })),
      request: protectedProcedure.input(appointmentRequestSchema).mutation(({ ctx, input }) => createViewingAppointment({
        seekerUserId: ensureUserId(ctx.user?.id),
        ...input,
      })),
      cancel: protectedProcedure.input(z.object({ appointmentId: z.number().int().positive(), note: z.string().trim().min(4).max(500).optional() }))
        .mutation(({ ctx, input }) => cancelViewingAppointment({ userId: ensureUserId(ctx.user?.id), appointmentId: input.appointmentId, actor: "seeker", note: input.note })),
      recordSeekerOutcome: protectedProcedure.input(z.object({
        appointmentId: z.number().int().positive(),
        outcome: z.enum(["matched_listing", "price_differed", "already_rented", "did_not_attend"]),
        note: z.string().trim().max(500).optional(),
      })).mutation(({ ctx, input }) => recordSeekerViewingOutcome({ seekerUserId: ensureUserId(ctx.user?.id), ...input })),
    }),
  }),

  agent: router({
    profile: agentWorkspaceProcedure.query(async ({ ctx }) => (await getAgentProfile(ensureUserId(ctx.user?.id))) ?? null),
    setupProfile: agentWorkspaceProcedure.input(z.object({
      publicName: z.string().trim().min(2).max(100), agencyName: z.string().trim().max(120).optional(),
      whatsappPhone: z.string().trim().min(8).max(30),
    })).mutation(({ ctx, input }) => upsertAgentProfile({ userId: ensureUserId(ctx.user?.id), publicName: input.publicName, agencyName: input.agencyName || undefined, whatsappPhone: normalizeCameroonWhatsAppPhone(input.whatsappPhone) })),
    listings: agentWorkspaceProcedure.query(({ ctx }) => listAgentListings(ensureUserId(ctx.user?.id))),
    qualityDashboard: agentWorkspaceProcedure.query(({ ctx }) => getAgentQualityDashboard(ensureUserId(ctx.user?.id))),
    paidStatus: agentWorkspaceProcedure.query(({ ctx }) => getAgentPaidStatus(ensureUserId(ctx.user?.id))),
    identityStatus: agentWorkspaceProcedure.query(({ ctx }) => getAgentIdentityStatus(ensureUserId(ctx.user?.id))),
    paymentOrders: agentWorkspaceProcedure.query(({ ctx }) => listAgentPaymentOrders(ensureUserId(ctx.user?.id))),
    officialServiceReceipt: agentWorkspaceProcedure.input(z.object({ orderId: z.string().min(6).max(32) }))
      .query(({ ctx, input }) => getAgentOfficialServiceReceipt(ensureUserId(ctx.user?.id), input.orderId)),
    createPaymentOrder: agentWorkspaceProcedure.input(z.object({
      type: z.enum(["welcome_bundle", "starter_access", "pro_access", "featured_pin", "physical_verification_route_batch", "physical_verification_individual"]),
      listingId: z.string().min(4).max(32).optional(),
    })).mutation(({ ctx, input }) => createPaymentOrder(
      ensureUserId(ctx.user?.id), input.type as PaidOfferType, input.listingId,
    )),
    submitPaymentReference: agentWorkspaceProcedure.input(z.object({
      orderId: z.string().min(6).max(32), provider: z.enum(["mtn_momo", "orange_money"]),
      reference: z.string().trim().min(6).max(120),
    })).mutation(({ ctx, input }) => submitPaymentReference(
      ensureUserId(ctx.user?.id), input.orderId, input.provider as "mtn_momo" | "orange_money", input.reference,
    )),
    submitListing: agentWorkspaceProcedure.input(listingSubmissionSchema).mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.user?.id);
      const profile = await getAgentProfile(userId);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Create your agent profile before submitting a listing." });
      const point = createApproximatePoint(input.landmarkLatitude, input.landmarkLongitude, input.mapRadiusM);
      let id: string;
      try {
        id = await createListing({
          agentUserId: userId, agentNameSnapshot: profile.publicName, title: input.title, city: input.city,
          neighborhood: input.neighborhood, landmark: input.landmark, propertyType: input.propertyType, furnishingStatus: input.furnishingStatus,
          description: input.description, bedrooms: input.bedrooms, bathrooms: input.bathrooms,
          parkingSpaces: input.parkingSpaces, amenities: input.amenities, householdFit: input.householdFit, availableFrom: input.availableFrom, publicLatitude: point.latitude,
          publicLongitude: point.longitude, mapRadiusM: point.radiusM, costs: input.costs,
        });
      } catch (error) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Listing eligibility could not be confirmed." });
      }
      return { id, status: "under_review" as const };
    }),
    reconfirm: agentWorkspaceProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .mutation(({ ctx, input }) => reconfirmAgentListing(ensureUserId(ctx.user?.id), input.listingId)),
    updateCosts: agentWorkspaceProcedure.input(z.object({
      listingId: z.string().min(4).max(32),
      changeReason: z.string().trim().min(6).max(500),
      costs: z.object({
        monthlyRent: z.number().int().min(0).max(5_000_000), advanceMonths: z.number().int().min(0).max(24),
        securityDeposit: z.number().int().min(0).max(10_000_000), agencyFee: z.number().int().min(0).max(10_000_000),
        serviceFee: z.number().int().min(0).max(10_000_000), firstMonthUtilities: z.number().int().min(0).max(5_000_000),
      }),
    })).mutation(({ ctx, input }) => updateAgentListingCosts({ agentUserId: ensureUserId(ctx.user?.id), ...input })),
    requestFeaturedPin: agentWorkspaceProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .mutation(({ ctx, input }) => createPromotionRequest(ensureUserId(ctx.user?.id), input.listingId)),
    requestPhysicalVerification: agentWorkspaceProcedure.input(z.object({
      listingId: z.string().min(4).max(32),
      serviceType: z.enum(["route_batch", "individual"]),
    })).mutation(({ ctx, input }) => createPaymentOrder(
      ensureUserId(ctx.user?.id),
      input.serviceType === "route_batch" ? "physical_verification_route_batch" : "physical_verification_individual",
      input.listingId,
    )),
    viewingAppointments: router({
      list: agentWorkspaceProcedure.query(({ ctx }) => listAgentViewingAppointments(ensureUserId(ctx.user?.id))),
      respond: agentWorkspaceProcedure.input(z.object({
        appointmentId: z.number().int().positive(),
        decision: z.enum(["confirmed", "declined"]),
        note: z.string().trim().min(4).max(500).optional(),
      }).superRefine((value, issue) => {
        if (value.decision === "declined" && !value.note) issue.addIssue({ code: z.ZodIssueCode.custom, message: "Record a brief reason when declining a viewing request." });
      })).mutation(({ ctx, input }) => respondToViewingAppointment({ agentUserId: ensureUserId(ctx.user?.id), ...input })),
      reconfirmAvailability: agentWorkspaceProcedure.input(z.object({ appointmentId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => reconfirmViewingAppointmentAvailability({ agentUserId: ensureUserId(ctx.user?.id), appointmentId: input.appointmentId })),
      cancel: agentWorkspaceProcedure.input(z.object({ appointmentId: z.number().int().positive(), note: z.string().trim().min(4).max(500).optional() }))
        .mutation(({ ctx, input }) => cancelViewingAppointment({ userId: ensureUserId(ctx.user?.id), appointmentId: input.appointmentId, actor: "agent", note: input.note })),
      recordOutcome: agentWorkspaceProcedure.input(z.object({
        appointmentId: z.number().int().positive(), outcome: z.enum(["completed", "no_show"]), note: z.string().trim().min(4).max(500).optional(),
      })).mutation(({ ctx, input }) => recordViewingAppointmentOutcome({ agentUserId: ensureUserId(ctx.user?.id), ...input })),
    }),
    viewingSlots: router({
      list: agentWorkspaceProcedure.query(({ ctx }) => listAgentViewingSlots(ensureUserId(ctx.user?.id))),
      create: agentWorkspaceProcedure.input(z.object({
        listingId: z.string().min(4).max(32),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })).mutation(({ ctx, input }) => createAgentViewingSlot({
        agentUserId: ensureUserId(ctx.user?.id),
        listingId: input.listingId,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      })),
      cancel: agentWorkspaceProcedure.input(z.object({ slotId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => cancelAgentViewingSlot({ agentUserId: ensureUserId(ctx.user?.id), slotId: input.slotId })),
    }),
  }),

  operations: router({
    reviewQueue: moderatorProcedure.query(() => listOperationsReviewQueue()),
    reviewHistory: moderatorProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .query(({ input }) => listReviewHistory(input.listingId)),
    verificationQueue: moderatorProcedure.query(() => listOperationsVerificationQueue()),
    verificationBatches: moderatorProcedure.query(() => listModeratorVerificationBatches()),
    verificationEvidenceHistory: moderatorProcedure.query(() => listOperationsVerificationEvidence()),
    verificationAuditQueue: moderatorProcedure.query(() => listVerificationAuditQueue()),
    duplicateListingReviews: moderatorProcedure.query(() => listDuplicateListingReviews()),
    decideDuplicateListingReview: moderatorProcedure.input(z.object({
      reviewId: z.number().int().positive(), decision: z.enum(["dismissed", "confirmed_duplicate"]), note: z.string().trim().min(6).max(500),
    })).mutation(({ ctx, input }) => decideDuplicateListingReview({ reviewerUserId: ensureUserId(ctx.user?.id), ...input })),
    assignReview: moderatorProcedure.input(z.object({ listingId: z.string().min(4).max(32), moderatorUserId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => assignListingReview(ensureUserId(ctx.user?.id), input.listingId, input.moderatorUserId)),
    decideReview: moderatorProcedure.input(z.object({
      listingId: z.string().min(4).max(32), decision: z.enum(["approved", "changes_requested", "rejected"]),
      reason: z.string().trim().min(8).max(1_200),
    })).mutation(({ ctx, input }) => decideListingReview(ensureUserId(ctx.user?.id), input.listingId, input.decision, input.reason)),
    claimVerification: moderatorProcedure.input(z.object({ verificationOrderId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => claimVerificationOrder(ensureUserId(ctx.user?.id), input.verificationOrderId)),
    claimVerificationAudit: moderatorProcedure.input(z.object({ auditId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => {
        if (ctx.user?.role !== "moderator") throw new TRPCError({ code: "FORBIDDEN", message: "Only a Field Moderator may conduct an independent second visit." });
        return claimVerificationAudit(ensureUserId(ctx.user?.id), input.auditId);
      }),
    completeVerificationAudit: moderatorProcedure.input(z.object({
      auditId: z.number().int().positive(),
      outcome: z.enum(["confirmed", "disputed"]),
      listingMatch: z.enum(["matches", "partially_matches", "does_not_match"]),
      exteriorProofUrl: z.string().url(),
      supportingProofUrl: z.string().url(),
      observation: z.string().trim().min(12).max(1_200),
    })).mutation(({ ctx, input }) => {
      if (ctx.user?.role !== "moderator") throw new TRPCError({ code: "FORBIDDEN", message: "Only a Field Moderator may complete an independent second visit." });
      return completeVerificationAudit(
        ensureUserId(ctx.user?.id), input.auditId, input.outcome, input.listingMatch,
        input.exteriorProofUrl, input.supportingProofUrl, input.observation,
      );
    }),
    decideVerification: moderatorProcedure.input(z.object({
      verificationOrderId: z.number().int().positive(), decision: z.enum(["passed", "failed"]),
      evidenceNote: z.string().trim().min(12).max(1_200),
      evidence: z.array(z.object({ kind: z.enum(["exterior", "interior", "bathroom", "document", "other"]), mediaUrl: z.string().url(), listingMatch: z.enum(["matches", "partially_matches", "does_not_match"]), observation: z.string().trim().min(8).max(1_200) })).min(2),
      neighborhood: z.object({
        waterAccess: z.enum(["borehole_on_site", "water_storage_seen", "public_network_observed", "not_confirmed"]),
        powerReliability: z.enum(["backup_seen", "prepaid_meter_seen", "local_low_outage_assessment", "local_outage_caution", "not_confirmed"]),
        roadAccess: z.enum(["tarred_to_gate", "tarred_nearby", "dirt_track_to_gate", "not_confirmed"]),
        taxiWalkMinutes: z.number().int().min(0).max(60).nullable().optional(),
        junctionName: z.string().trim().min(2).max(100).nullable().optional(),
        junctionMinutes: z.number().int().min(0).max(60).nullable().optional(),
        observationNote: z.string().trim().min(12).max(1_200),
      }).optional(),
    })).mutation(({ ctx, input }) => decideVerificationOrder(
      ensureUserId(ctx.user?.id), input.verificationOrderId, input.decision, input.evidenceNote, input.evidence, input.neighborhood,
    )),
    myVerificationCommissions: moderatorProcedure.query(({ ctx }) => listFieldModeratorCommissions(ensureUserId(ctx.user?.id))),
    archiveFreshnessGuard: adminProcedure.mutation(() => archiveStaleListings()),
  }),

  admin: router({
    settings: adminProcedure.query(() => getPlatformSettings()),
    updateSettings: adminProcedure.input(z.object({
      agentAccessFeeXaf: z.number().int().min(0).max(100_000),
      starterAccessFeeXaf: z.number().int().min(0).max(100_000),
      proAccessFeeXaf: z.number().int().min(0).max(100_000),
      featuredPinFeeXaf: z.number().int().min(0).max(100_000),
      routeBatchVerificationFeeXaf: z.number().int().min(0).max(100_000),
      physicalVerificationFeeXaf: z.number().int().min(0).max(100_000),
      fieldModeratorShareBps: z.number().int().min(0).max(10_000),
      ownerAlertsEnabled: z.boolean().default(true),
    })).mutation(({ ctx, input }) => updatePlatformSettings(ensureUserId(ctx.user?.id), input)),
    users: adminProcedure.query(() => listAdminUsers()),
    setUserBan: adminProcedure.input(z.object({ userId: z.number().int().positive(), isBanned: z.boolean(), reason: z.string().trim().min(8).max(800) }))
      .mutation(({ ctx, input }) => setUserBan(ensureUserId(ctx.user?.id), input.userId, input.isBanned, input.reason)),
    setUserRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["seeker", "agent", "moderator", "admin"]) }))
      .mutation(({ ctx, input }) => setUserRole(ensureUserId(ctx.user?.id), input.userId, input.role)),
    cashFlowAudit: adminProcedure.query(() => getAdminCashFlowAudit()),
    pilotSummary: adminProcedure.query(() => getAdminPilotSummary()),
    weeklyPilotActivity: adminProcedure.query(() => getAdminWeeklyPilotActivity()),
    commissionLedger: adminProcedure.query(() => listAdminCommissionLedger()),
    verificationAudits: adminProcedure.query(() => listVerificationAuditQueue()),
    approveHeldCommission: adminProcedure.input(z.object({ commissionId: z.number().int().positive(), evidenceReviewNote: z.string().trim().min(12).max(1_200) }))
      .mutation(({ ctx, input }) => approveHeldCommission(ensureUserId(ctx.user?.id), input.commissionId, input.evidenceReviewNote)),
    trustReports: adminProcedure.query(() => listAdminTrustReports()),
    resolveTrustReport: adminProcedure.input(z.object({ reportId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => resolveTrustReport(ensureUserId(ctx.user?.id), input.reportId)),
    purchaseConfirmationCandidates: adminProcedure.query(() => listAdminPurchaseConfirmationCandidates()),
    confirmPurchase: adminProcedure.input(z.object({
      appointmentId: z.number().int().positive(),
      note: z.string().trim().min(8).max(500).optional(),
    })).mutation(({ ctx, input }) => confirmPurchaseFromViewing({
      adminUserId: ensureUserId(ctx.user?.id),
      appointmentId: input.appointmentId,
      note: input.note,
    })),
    pendingAgentReviews: adminProcedure.query(() => listPendingAgentReviews()),
    moderateAgentReview: adminProcedure.input(z.object({
      reviewId: z.number().int().positive(),
      decision: z.enum(["approved", "rejected"]),
      note: z.string().trim().max(500).optional(),
    })).mutation(({ ctx, input }) => moderateAgentReview({
      adminUserId: ensureUserId(ctx.user?.id),
      reviewId: input.reviewId,
      decision: input.decision,
      note: input.note,
    })),
    ownerAlertProvider: adminProcedure.query(() => getOwnerAlertProviderStatus()),
    ownerAlerts: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
      .query(({ input }) => listOwnerAlerts(input?.limit ?? 50)),
    sendOwnerAlertTest: adminProcedure.mutation(() => createOwnerAlertAnnouncement()),
    releaseSafetyHold: adminProcedure.input(z.object({ listingId: z.string().min(4).max(32), reason: z.string().trim().min(12).max(1_200) }))
      .mutation(({ ctx, input }) => releaseListingSafetyHold(ensureUserId(ctx.user?.id), input.listingId, input.reason)),
    leadEvents: adminProcedure.query(() => listAdminLeadEvents()),
    paymentQueue: adminProcedure.query(() => listOperationsPaymentQueue()),
    officialServiceReceipt: adminProcedure.input(z.object({ orderId: z.string().min(6).max(32) }))
      .query(({ input }) => getAdminOfficialServiceReceipt(input.orderId)),
    reviewQueue: adminProcedure.query(() => listOperationsReviewQueue()),
    reviewHistory: adminProcedure.input(z.object({ listingId: z.string().min(4).max(32) })).query(({ input }) => listReviewHistory(input.listingId)),
    assignReview: adminProcedure.input(z.object({ listingId: z.string().min(4).max(32), moderatorUserId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => assignListingReview(ensureUserId(ctx.user?.id), input.listingId, input.moderatorUserId)),
    decideReview: adminProcedure.input(z.object({ listingId: z.string().min(4).max(32), decision: z.enum(["approved", "changes_requested", "rejected"]), reason: z.string().trim().min(8).max(1_200) }))
      .mutation(({ ctx, input }) => decideListingReview(ensureUserId(ctx.user?.id), input.listingId, input.decision, input.reason)),
    reconcilePayment: adminProcedure.input(z.object({ orderId: z.string().min(6).max(32), decision: z.enum(["confirmed", "rejected"]), note: z.string().trim().min(6).max(800) }))
      .mutation(({ ctx, input }) => reconcilePaymentOrder(ensureUserId(ctx.user?.id), input.orderId, input.decision, input.note)),
  }),
});

export type AppRouter = typeof appRouter;
