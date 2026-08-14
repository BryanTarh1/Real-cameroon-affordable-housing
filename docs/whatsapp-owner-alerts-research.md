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
