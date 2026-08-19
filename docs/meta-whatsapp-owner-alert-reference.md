# Meta WhatsApp owner-alert reference

Reviewed 19 August 2026 for the AHC owner-alert implementation.

Meta documents that an approved WhatsApp template can be sent through the Cloud API outside a customer-service window. Template messages must use a template with an approved status; the template language and positional or named variables must match the template definition. This supports AHC's existing utility-template approach, which supplies a non-sensitive event label, reference ID, and protected Admin dashboard URL.

Meta also documents that the `messages` webhook reports delivery state for outgoing business messages. Webhook handlers must tolerate duplicate callbacks because retries can occur for up to seven days after failed endpoint delivery. AHC's design therefore keeps a signed webhook verification boundary and idempotently advances an existing alert record rather than emitting a new alert from a callback.

Sources: [Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview); [Webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview).
