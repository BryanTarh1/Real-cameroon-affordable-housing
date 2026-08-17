import type { Request, Response } from "express";
import { expireDueViewingAvailability } from "./db";
import { sdk } from "./_core/sdk";

/**
 * Platform-scheduled, idempotent expiry for viewing requests whose Agent has
 * not reconfirmed availability by the stored 48-hour deadline.
 */
export async function expireOverdueViewingAvailabilityHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await expireDueViewingAvailability();
    return res.json({ ok: true, expired: result.expired, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown viewing-availability expiry error";
    console.error("[AHC viewing availability expiry]", error);
    return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
  }
}
