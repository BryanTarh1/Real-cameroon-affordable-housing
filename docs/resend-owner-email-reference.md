# Resend transactional email reference for owner alerts

Source: [Resend, "Send Email" API reference](https://resend.com/docs/api-reference/emails/send-email), retrieved 19 August 2026.

The production owner-alert fallback requires a server-only `RESEND_API_KEY` and a verified sender domain/address. Email is sent by `POST https://api.resend.com/emails` using `Authorization: Bearer <API key>` and JSON containing `from`, `to`, `subject`, and `text` or `html`. The API supports the `Idempotency-Key` header, which must be unique per request and remains valid for 24 hours; the AHC alert dedupe key is suitable for this purpose.

AHC will send plain-text operational alerts only. Each message contains an approved event label, a non-sensitive reference identifier, and the Admin dashboard URL. It must not contain passwords, account names, emails, phone numbers, personal identity data, property exact locations, rent or deposit data, payment references, safety-report contents, or private evidence.
