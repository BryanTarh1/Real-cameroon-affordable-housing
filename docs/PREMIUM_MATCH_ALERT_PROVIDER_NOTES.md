# Premium Match Alerts — Provider Requirements

## Current delivery decision

AHC will store a seeker's explicit WhatsApp alert consent, matching criteria, alert-queue entries, and delivery outcomes in its own database. **No live outbound WhatsApp alert is enabled until AHC configures an approved WhatsApp Business provider and an approved message template.** This preserves an auditable opt-in record and avoids claiming delivery before a provider confirms it.

## Meta WhatsApp Business Platform findings

Meta's WhatsApp Business Platform supports outbound message sending and delivery-status callbacks. Messages sent outside an active customer-service window must use an approved template; the template's language and variable examples are configured before sending. Message-status callbacks are delivered to a configured HTTPS webhook and may be retried, so delivery processing must be idempotent.

For a direct Cloud API integration, AHC will need a Meta app, WhatsApp Business Account, business phone-number ID, permanent system-user access token, approved opt-in wording, and an approved template such as `ahc_match_alert`. The receiver must verify webhook requests before trusting status payloads. The agent session contains no configured WhatsApp provider or credentials as of 13 August 2026.

## Implementation boundary

The product can safely ship the premium alert preference interface and queue first. Activating actual message sends requires a deliberate owner decision between a direct Meta Cloud API account and a suitable WhatsApp Business solution provider, followed by secure credentials and approved template details. The alert queue must record `queued`, `sent`, `delivered`, `read`, `failed`, or `suppressed` states rather than infer a conversation or tenancy outcome.

## Sources

1. Meta for Developers, [WhatsApp Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), accessed 13 August 2026.
2. Meta for Developers, [Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview), accessed 13 August 2026.
3. Meta for Developers, [WhatsApp webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview), accessed 13 August 2026.
