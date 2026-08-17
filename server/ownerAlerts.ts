import { createHmac, timingSafeEqual } from "node:crypto";
import type { OwnerAlertEventType, OwnerAlertStatus } from "../shared/ahc";

export const META_WHATSAPP_GRAPH_VERSION = "v25.0";

export const OWNER_ALERT_EVENT_LABELS: Record<OwnerAlertEventType, string> = {
  payment_confirmed: "AHC platform-service payment confirmed",
  payment_rejected: "AHC platform-service payment rejected",
  verification_passed: "AHC physical verification passed",
  verification_failed: "AHC physical verification failed",
  safety_hold_applied: "AHC listing safety hold applied",
  safety_hold_released: "AHC listing safety hold released",
  listing_published: "AHC listing first published",
  announcement: "AHC owner operational announcement",
};

export type OwnerAlertTemplateInput = {
  ownerPhone: string;
  templateName: string;
  language: string;
  eventType: OwnerAlertEventType;
  referenceId: string;
  dashboardUrl: string;
};

export type MetaWhatsAppProviderInput = {
  phoneNumberId: string;
  accessToken: string;
  ownerPhone: string;
  templateName: string;
  webhookVerifyToken: string;
  appSecret: string;
};

/**
 * Sends remain paused until AHC can both dispatch its approved utility template
 * and cryptographically verify the resulting delivery-status webhook.
 */
export function getMetaWhatsAppProviderReadiness(input: MetaWhatsAppProviderInput) {
  const sendReady = Boolean(input.phoneNumberId && input.accessToken && input.ownerPhone && input.templateName);
  const webhookReady = Boolean(input.webhookVerifyToken && input.appSecret);
  return {
    sendReady,
    webhookReady,
    active: sendReady && webhookReady,
    missing: [
      ...(!input.phoneNumberId ? ["phone-number ID"] : []),
      ...(!input.accessToken ? ["access token"] : []),
      ...(!input.ownerPhone ? ["owner recipient"] : []),
      ...(!input.templateName ? ["utility template"] : []),
      ...(!input.webhookVerifyToken ? ["webhook verify token"] : []),
      ...(!input.appSecret ? ["app secret"] : []),
    ],
  };
}

/**
 * AHC's approved utility template contract is exactly three positional body
 * variables: event label, non-sensitive reference, then the Admin dashboard URL.
 */
export function buildOwnerAlertTemplatePayload(input: OwnerAlertTemplateInput) {
  return {
    messaging_product: "whatsapp" as const,
    to: input.ownerPhone,
    type: "template" as const,
    template: {
      name: input.templateName,
      language: { code: input.language },
      components: [{
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: OWNER_ALERT_EVENT_LABELS[input.eventType] },
          { type: "text" as const, text: input.referenceId },
          { type: "text" as const, text: input.dashboardUrl },
        ],
      }],
    },
  };
}

export function getOwnerAlertDashboardUrl(publicAppUrl: string) {
  return `${publicAppUrl.replace(/\/+$/, "")}/#/admin`;
}

/** Validates Meta's `X-Hub-Signature-256` against the unparsed request body. */
export function verifyMetaWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined, appSecret: string) {
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) return false;
  const supplied = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"), "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

type MetaWebhookStatus = { id: string; status: OwnerAlertStatus; failureReason: string | null };

/** Extracts only recognized delivery-state callbacks; unknown Meta event shapes are ignored safely. */
export function extractMetaDeliveryStatuses(payload: unknown): MetaWebhookStatus[] {
  if (!payload || typeof payload !== "object") return [];
  const entries = (payload as { entry?: unknown }).entry;
  if (!Array.isArray(entries)) return [];
  const valid = new Set<OwnerAlertStatus>(["sent", "delivered", "read", "failed"]);
  const results: MetaWebhookStatus[] = [];
  for (const entry of entries) {
    const changes = entry && typeof entry === "object" ? (entry as { changes?: unknown }).changes : undefined;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = change && typeof change === "object" ? (change as { value?: unknown }).value : undefined;
      const statuses = value && typeof value === "object" ? (value as { statuses?: unknown }).statuses : undefined;
      if (!Array.isArray(statuses)) continue;
      for (const item of statuses) {
        if (!item || typeof item !== "object") continue;
        const record = item as { id?: unknown; status?: unknown; errors?: unknown };
        if (typeof record.id !== "string" || typeof record.status !== "string" || !valid.has(record.status as OwnerAlertStatus)) continue;
        const errors = Array.isArray(record.errors) ? record.errors : [];
        const failureReason = record.status === "failed"
          ? errors.map(error => {
            if (!error || typeof error !== "object") return "";
            const details = error as { code?: unknown; title?: unknown; message?: unknown };
            return [details.code, details.title ?? details.message].filter(Boolean).join(" ");
          }).filter(Boolean).join("; ").slice(0, 900) || "Meta reported delivery failure."
          : null;
        results.push({ id: record.id, status: record.status as OwnerAlertStatus, failureReason });
      }
    }
  }
  return results;
}
