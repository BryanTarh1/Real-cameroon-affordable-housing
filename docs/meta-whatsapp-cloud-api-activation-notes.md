# Meta WhatsApp Cloud API activation notes

## Official sources consulted

- Meta, [WhatsApp Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), accessed 17 August 2026.
- Meta, [WhatsApp Business Platform webhooks overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview), accessed 17 August 2026.
- Meta, [Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview), accessed 17 August 2026.

## Activation facts relevant to AHC

Meta’s current setup requires a Meta developer account, a WhatsApp-enabled test device, a Meta application configured for the WhatsApp customer-connection use case, and a connected WhatsApp Business Account. A temporary token can send a test message, but Meta states that it expires quickly; live operation should use a system-user token with the required WhatsApp Business permissions.

AHC’s owner-alert implementation already sends approved utility-template payloads and deliberately avoids placing customer, payment, or property-sensitive data in template variables. Its Meta webhook endpoint must be configured for the `messages` field and validates the signed raw body. Meta documents that webhooks can deliver duplicate notifications through retry behavior, so AHC retains idempotent provider-message status handling.

The current server secret contract is: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_OWNER_PHONE`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, and `WHATSAPP_APP_SECRET`. These values remain absent until supplied securely by the owner; the application must retain its queued, non-delivering behavior until then.
