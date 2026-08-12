import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  archiveStaleListings,
  createListing,
  createListingReport,
  createPromotionRequest,
  getAgentProfile,
  getPublicListingContact,
  listAgentListings,
  listFreshPublicListings,
  reconfirmAgentListing,
  upsertAgentProfile,
} from "./db";
import { createApproximatePoint, createWhatsAppListingLink, normalizeCameroonWhatsAppPhone } from "../shared/ahc";

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
  householdFit: z.string().trim().max(80).optional(),
  availableFrom: z.string().date(),
  landmarkLatitude: z.number().min(2).max(5),
  landmarkLongitude: z.number().min(8).max(13),
  mapRadiusM: z.number().int().min(200).max(500),
  costs: costsSchema,
});

function ensureUserId(id: number | undefined): number {
  if (!id) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
  return id;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  marketplace: router({
    search: publicProcedure.input(z.object({
      city: z.string().optional(), search: z.string().trim().max(120).optional(),
      maxMonthlyRent: z.number().int().positive().optional(), maxMoveInCash: z.number().int().positive().optional(),
      verification: z.enum(["any", "physical_verified"]).default("any"),
    }).optional()).query(async ({ input }) => listFreshPublicListings(input ?? {})),
    getContact: publicProcedure.input(z.object({ listingId: z.string().min(4).max(32) })).query(async ({ input }) => {
      const listing = await getPublicListingContact(input.listingId);
      if (!listing?.agent.whatsappPhone) throw new TRPCError({ code: "NOT_FOUND", message: "This listing is no longer available for contact." });
      return { url: createWhatsAppListingLink(listing.agent.whatsappPhone, listing.id) };
    }),
    report: publicProcedure.input(z.object({ listingId: z.string().min(4).max(32), note: z.string().trim().min(10).max(800) }))
      .mutation(({ input }) => createListingReport(input.listingId, input.note)),
  }),

  agent: router({
    profile: protectedProcedure.query(({ ctx }) => getAgentProfile(ensureUserId(ctx.user?.id))),
    setupProfile: protectedProcedure.input(z.object({
      publicName: z.string().trim().min(2).max(100), agencyName: z.string().trim().max(120).optional(),
      whatsappPhone: z.string().trim().min(8).max(30),
    })).mutation(({ ctx, input }) => upsertAgentProfile({
      userId: ensureUserId(ctx.user?.id), publicName: input.publicName, agencyName: input.agencyName || undefined,
      whatsappPhone: normalizeCameroonWhatsAppPhone(input.whatsappPhone),
    })),
    listings: protectedProcedure.query(({ ctx }) => listAgentListings(ensureUserId(ctx.user?.id))),
    submitListing: protectedProcedure.input(listingSubmissionSchema).mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.user?.id);
      const profile = await getAgentProfile(userId);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Create your agent profile before submitting a listing." });
      const point = createApproximatePoint(input.landmarkLatitude, input.landmarkLongitude, input.mapRadiusM);
      const id = await createListing({
        agentUserId: userId, agentNameSnapshot: profile.publicName, title: input.title, city: input.city,
        neighborhood: input.neighborhood, landmark: input.landmark, propertyType: input.propertyType,
        householdFit: input.householdFit, availableFrom: input.availableFrom, publicLatitude: point.latitude,
        publicLongitude: point.longitude, mapRadiusM: point.radiusM, costs: input.costs,
      });
      return { id, status: "under_review" as const };
    }),
    reconfirm: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .mutation(({ ctx, input }) => reconfirmAgentListing(ensureUserId(ctx.user?.id), input.listingId)),
    requestFeaturedPin: protectedProcedure.input(z.object({ listingId: z.string().min(4).max(32) }))
      .mutation(({ ctx, input }) => createPromotionRequest(ensureUserId(ctx.user?.id), input.listingId)),
  }),

  operations: router({ archiveFreshnessGuard: publicProcedure.mutation(() => archiveStaleListings()) }),
});

export type AppRouter = typeof appRouter;
