import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildOwnerAlertTemplatePayload, extractMetaDeliveryStatuses, getMetaWhatsAppProviderReadiness, verifyMetaWebhookSignature } from "./ownerAlerts";

describe("AHC owner-only WhatsApp alert helpers", () => {
  it("builds the approved three-variable utility-template payload without private listing or payment data", () => {
    const payload = buildOwnerAlertTemplatePayload({
      ownerPhone: "237699000000",
      templateName: "ahc_owner_operational_alert",
      language: "en",
      eventType: "payment_confirmed",
      referenceId: "PAY-ACCESS-42",
      dashboardUrl: "https://affordableho-8aahm5dj.manus.space/#/admin",
    });

    expect(payload).toEqual({
      messaging_product: "whatsapp",
      to: "237699000000",
      type: "template",
      template: {
        name: "ahc_owner_operational_alert",
        language: { code: "en" },
        components: [{ type: "body", parameters: [
          { type: "text", text: "AHC platform-service payment confirmed" },
          { type: "text", text: "PAY-ACCESS-42" },
          { type: "text", text: "https://affordableho-8aahm5dj.manus.space/#/admin" },
        ] }],
      },
    });
    expect(JSON.stringify(payload)).not.toMatch(/rent|deposit|address|evidence|reference matched/i);
  });

  it("accepts only a valid Meta SHA-256 signature over the unchanged raw request body", () => {
    const body = Buffer.from(JSON.stringify({ entry: [] }));
    const secret = "test-app-secret";
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(verifyMetaWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyMetaWebhookSignature(body, "sha256=00", secret)).toBe(false);
    expect(verifyMetaWebhookSignature(body, undefined, secret)).toBe(false);
  });

  it("keeps live delivery paused until both the approved template sender and signed webhook monitoring are configured", () => {
    const sendOnly = getMetaWhatsAppProviderReadiness({
      phoneNumberId: "123", accessToken: "token", ownerPhone: "237699000000", templateName: "ahc_owner_operational_alert",
      webhookVerifyToken: "", appSecret: "",
    });
    expect(sendOnly.sendReady).toBe(true);
    expect(sendOnly.webhookReady).toBe(false);
    expect(sendOnly.active).toBe(false);
    expect(sendOnly.missing).toEqual(["webhook verify token", "app secret"]);

    const complete = getMetaWhatsAppProviderReadiness({
      phoneNumberId: "123", accessToken: "token", ownerPhone: "237699000000", templateName: "ahc_owner_operational_alert",
      webhookVerifyToken: "verify", appSecret: "app-secret",
    });
    expect(complete.active).toBe(true);
    expect(complete.missing).toEqual([]);
  });

  it("extracts recognized delivery states while discarding unrelated inbound-message data", () => {
    const statuses = extractMetaDeliveryStatuses({
      entry: [{ changes: [{ value: {
        messages: [{ from: "237600000000", text: { body: "ignore me" } }],
        statuses: [
          { id: "wamid.delivered-1", status: "delivered" },
          { id: "wamid.failed-2", status: "failed", errors: [{ code: 131026, title: "Message undeliverable" }] },
          { id: "wamid.unknown-3", status: "pending" },
        ],
      } }] }],
    });

    expect(statuses).toEqual([
      { id: "wamid.delivered-1", status: "delivered", failureReason: null },
      { id: "wamid.failed-2", status: "failed", failureReason: "131026 Message undeliverable" },
    ]);
  });
});
