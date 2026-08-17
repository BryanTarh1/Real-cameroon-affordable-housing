import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (ctx.user.isBanned) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This AHC account is suspended. Contact platform support if you believe this is an error." });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * The Agent workspace is available to ordinary AHC accounts only. Staff use
 * distinct Moderator and Admin procedure trees, even when calling APIs directly.
 */
export const agentWorkspaceProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || opts.ctx.user.role !== "user") {
      throw new TRPCError({ code: "FORBIDDEN", message: "The Agent workspace is unavailable for staff accounts." });
    }
    return opts.next({ ctx: opts.ctx });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.isBanned || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/** Operational actions are available to administrators and explicitly designated moderators. */
export const moderatorProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.isBanned || !["admin", "moderator"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
