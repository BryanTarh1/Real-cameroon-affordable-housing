import type { Request, Response } from "express";
import { archiveStaleListings } from "./db";
import { sdk } from "./_core/sdk";

/**
 * Platform-scheduled, idempotent cleanup of stale public inventory.
 * The request must be a trusted cron identity; browser callers cannot archive records.
 */
export async function archiveStaleListingHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await archiveStaleListings();
    return res.json({ ok: true, archived: result.archived, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown archival error";
    console.error("[AHC freshness archive]", error);
    return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
  }
}
