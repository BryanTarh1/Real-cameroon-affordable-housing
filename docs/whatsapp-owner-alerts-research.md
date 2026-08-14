# WhatsApp Owner Alerts: Official Delivery Requirements

## Sources reviewed

1. [Meta WhatsApp Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), updated 16 June 2026.
2. [Meta WhatsApp Template Fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview), updated 21 May 2026.
3. [Meta WhatsApp Webhooks Overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview), updated 26 June 2026.

## Findings that govern AHC implementation

- Meta requires a Meta/managed account, developer registration, a Meta app using the WhatsApp use case, and a connected WhatsApp Business Account and business phone number before Cloud API sending can begin.
- A temporary API token is suitable only for first testing. Production operation requires a System User access token with the relevant WhatsApp permissions, stored only as a protected server secret.
- Outbound operational alerts outside the customer-service window must use an approved WhatsApp template. AHC should use a concise `utility` template rather than a marketing template for owner payment, verification, safety, and publication alerts.
- Templates can use named or positional variables. AHC messages should carry only the event type, a non-sensitive order/listing reference, and a secure dashboard link—never payment references, exact addresses, identity-document data, or private field evidence.
- Templates must be approved before they can be sent. Template quality or status changes can be surfaced through Meta webhook events.
- The `messages` webhook includes business-message status events (such as sent, delivered, and read). Webhook requests may be retried for up to seven days when a non-200 response is returned, so AHC must verify signatures, process events idempotently, and record delivery status without sending a duplicate owner alert.
- A production webhook endpoint must be internet-accessible and configured in the Meta App Dashboard. The documented webhook permissions include `whatsapp_business_messaging` for message webhooks and `whatsapp_business_management` for other WhatsApp account webhooks.

## AHC recommended event and delivery posture

The alert recipient is the configured platform owner/admin number only. The first release should trigger alerts only after durable system events: payment reconciliation confirmed/rejected, verification outcome recorded, safety hold applied/released, and announcement published. Each event should be written to an auditable alert-outbox row before delivery; a retryable worker or event handler must mark it `sent`, `delivered`, `read`, or `failed` based on provider responses and verified webhook status callbacks.

The integration must never be used to transmit tenant rent, deposits, or tenancy settlements. It operates solely for AHC’s own platform-service and safety notifications.

## Current implementation notes (verified 14 August 2026)

- Meta identifies the `messages` webhook as the channel for business-sent message status changes. AHC therefore subscribes only to the delivery-status records it needs for the owner-alert outbox.
- Meta documents webhook payloads of up to 3 MB and retries non-200 deliveries for up to seven days. The endpoint must return a successful response after idempotently recording recognised status callbacks, rather than treating a retry as a second outbound alert.
- Source: [Meta WhatsApp Business Platform — Webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview), updated 26 June 2026.

## Activation checklist for the AHC owner

1. In [Meta for Developers](https://developers.facebook.com/), create or select the AHC Meta App, add the WhatsApp product, and connect the intended WhatsApp Business Account and business phone number. Copy the **Phone number ID** from **WhatsApp → API Setup**.
2. Use the temporary token shown on that page only for a controlled first test. Before operational use, create a System User in Meta Business Settings, grant only the WhatsApp messaging/management permissions required by the app, and generate the protected **Access Token**.
3. In WhatsApp Manager, create an approved **Utility** template. Its body must have exactly these three positional variables in this order: `{{1}}` event label, `{{2}}` non-sensitive AHC reference, and `{{3}}` Admin dashboard URL. Suggested body: `AHC operational update: {{1}}. Reference: {{2}}. Review: {{3}}`. Do not include a payment reference, rent, deposit, address, identity data, or verification evidence.
4. Generate a long random **Webhook Verify Token**. In **WhatsApp → Configuration**, register `https://affordableho-8aahm5dj.manus.space/api/whatsapp/webhook` as the callback URL, use that same verify token, and subscribe the app to the `messages` field. The AHC endpoint uses the App Secret to verify the `X-Hub-Signature-256` request signature before it records any provider status.
5. Copy the Meta **App Secret** from **App Settings → Basic**. Enter the six values as protected project secrets: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_OWNER_PHONE`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, and `WHATSAPP_APP_SECRET`.
6. Sign in as the AHC Admin. Confirm the provider status is ready, leave **Owner alerts** enabled, and send a test alert. The Admin history must show a new outbox row. Meta status callbacks then update the same row from `sent` to `delivered`, `read`, or `failed` rather than creating another alert.

## Live-operation safeguards

- The configured owner number is the only recipient. The Admin UI intentionally shows a masked number and never returns the access token or App Secret.
- If credentials are missing, alerts are stored as `queued`/`suppressed` instead of attempting a network call. No payment or moderation decision is reversed because provider delivery fails.
- Disable Owner alerts from the Admin workspace before rotating a token or changing a template. Re-enable it only after a successful test dispatch and verified delivery callback.
- The outbox is an operational record, not a tenancy ledger. It must not be used to request, receive, hold, or distribute rent, deposits, or any tenancy money.
