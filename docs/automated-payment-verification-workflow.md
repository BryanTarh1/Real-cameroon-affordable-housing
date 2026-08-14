# AHC Automated Platform-Service Payment Verification Workflow

**Author:** Manus AI  
**Status:** Recommended design; no payment provider is connected yet  
**Scope:** AHC-owned service orders only. This workflow must never collect, route, hold, or release tenant rent, deposits, agency fees, or tenancy settlements.

## Purpose

AHC can reduce the Admin payment queue without trusting an Agent-entered Mobile Money reference. The safe model is that **AHC creates the payment request**, the external provider returns the result, and the AHC server independently confirms the final provider status before granting a commercial entitlement. This preserves the existing rule that a submitted reference alone has no value.

> **Verification principle:** A callback or browser return is a prompt to verify, not proof of payment. AHC grants an entitlement only after a server-to-server provider status check matches its own open service order.

The public MTN MoMo product overview describes merchant collection, invoices, payment-status capability, and business disbursements. [1] Kora’s Mobile Money guide documents the same control sequence: a unique merchant reference, wallet authorization, server-side status verification, and a payment webhook. [2] Notch Pay likewise documents a callback reference followed by a provider transaction-status query before a merchant updates its records. [3]

## Target service journey

| Stage | Customer experience | Automated server responsibility | Admin responsibility |
|---|---|---|---|
| 1. Select service | Agent selects Welcome, Starter, Pro, Featured, or a verification service in `/#/agent`. | Create one immutable AHC order with the service type, expected XAF amount, expiry, and a unique internal reference. | None. |
| 2. Start provider payment | Agent is redirected to hosted checkout or receives a secure wallet-prompt flow. | Create one provider payment intent using the AHC order reference as metadata; never expose a provider secret to the browser. | None. |
| 3. Authorize wallet | Agent authorizes with their own Mobile Money PIN or provider-hosted page. | Store only the provider payment identifier and masked payer detail when permitted; do not store wallet PINs, OTPs, or raw sensitive payment data. | None. |
| 4. Receive provider event | Agent sees a pending or success screen. | Authenticate the webhook; deduplicate it; query the provider status endpoint; compare reference, merchant account, currency, expected amount, and final status. | None for clean matches. |
| 5. Reconcile entitlement | Agent sees a confirmed receipt and their paid entitlement. | Atomically mark the order confirmed once and grant the exact entitlement once. | Review only exceptions. |
| 6. Exception handling | Agent sees a clear pending/review or failed message. | Move mismatched, duplicated, expired, incomplete, or unverifiable payment events to an Admin exception queue. | Resolve or reject with a recorded reason. |

## Automatic-confirmation rule

AHC should automatically reconcile an order only when **all** of the following are true:

| Required control | Reason |
|---|---|
| The provider webhook signature or equivalent authenticity mechanism is valid. | Stops unauthenticated callers from imitating provider events. |
| The provider payment identifier has not already been processed. | Makes repeated webhook delivery safe and prevents duplicate credit grants. |
| The provider-side lookup reports a final successful status. | A browser redirect, “processing” state, or user-provided screenshot is not sufficient. |
| The provider reference maps to one open AHC order. | Stops a paid reference from being attached to a different service. |
| The amount equals the server-calculated order amount in XAF. | Prevents underpayment and price substitution. |
| The currency, merchant account, and payment environment match the AHC configuration. | Stops sandbox events, wrong-currency transfers, and payments to an unrelated merchant account. |
| The order has not expired, been cancelled, refunded, or already been reconciled. | Prevents replay and post-expiry entitlement grants. |

If any check fails, AHC must **not** partially grant the offer. It creates an immutable exception record, preserves the provider payload only as necessary for audit, and lets an Admin decide the outcome.

## Resulting order states

| Status | Meaning | Who can move it |
|---|---|---|
| `awaiting_payment` | AHC order was created but no provider result is final. | System or expiry job. |
| `provider_processing` | Wallet prompt or hosted payment is underway. | Provider event or safe requery. |
| `confirmed_automatically` | All matching checks succeeded and entitlement was granted once. | System only. |
| `needs_admin_review` | A safety check failed or a provider response could not be verified. | System creates it; Admin resolves it. |
| `rejected` | Admin rejected it with a reason. | Admin only. |
| `expired` | Payment was not completed within the stated window. | System. |
| `refunded` | Approved provider refund was confirmed. | Admin-approved system process. |

## Entitlement boundary after confirmation

The server uses the already-approved commercial rules; payment automation does not bypass them.

| Confirmed AHC order | Server action |
|---|---|
| Welcome Bundle | Mark the one-time Welcome entitlement used, activate 30 days of normal-priority access, and issue five listing credits. |
| Starter | Activate 30 days of normal-priority access and issue five listing credits. |
| Pro | Activate 30 days of priority access; enforce the 20 active-listing limit at listing creation. |
| Featured | Apply exactly seven days of featured placement to the chosen eligible listing. |
| Route-batch verification | Create one pending route-batch verification request for one property; no badge is granted until the Field Moderator passes the visit and review rules are met. |
| Individual verification | Create one pending individual verification request for one property under the same evidence and review standard. |

The confirmation event must be committed with an idempotency key in a single database transaction. A repeated webhook, retry, or staff page refresh must return the existing result and never issue a second credit, second plan period, or second verification request.

## Fraud and human-review queue

The automation should deliberately stop at the following boundaries instead of guessing.

| Trigger | Automatic system response | Admin decision |
|---|---|---|
| Amount, currency, merchant, or internal reference mismatch | Freeze in `needs_admin_review`; grant nothing. | Reject, correct a configuration issue, or handle verified over/underpayment under policy. |
| Same provider reference linked to two orders | Lock both affected records and log the collision. | Decide the valid order and reject the duplicate claim. |
| Webhook arrives but provider lookup remains pending | Retry safely on a short back-off schedule, then expire or queue for review. | Review only if the provider status remains unresolved. |
| Provider reports failure, cancellation, or reversal | Mark failed/reversed; remove no previously granted entitlement without an audited refund/reversal process. | Investigate if an entitlement was already used. |
| Repeated suspicious attempts from one account | Rate-limit new payment intents and flag the account. | Suspend or restore account access based on evidence. |
| Refund request | Keep entitlement and payout consequences visible; do not automate a refund solely from the request. | Approve a documented provider refund and apply the matching entitlement policy. |

## Privacy and security controls

Payment-provider secrets belong only in server-side environment settings. The browser receives a checkout URL, a short-lived payment session, or a provider prompt instruction—not API credentials. AHC should log webhook event identifiers, order identifiers, status transitions, actor, and timestamp; it should mask payer wallet numbers in operational screens and restrict raw provider payload access to Admins with a genuine reconciliation need.

The webhook endpoint should enforce signature validation, a small request body limit, strict content type, IP or provider-origin controls if the provider supports them, duplicate-event storage, and rapid acknowledgement after durable event capture. Provider status verification should occur from the server rather than the browser. AHC should also retain manual reconciliation as a fallback during provider downtime and use a visible “payment is still being verified” state rather than promising immediate access.

## Moderator payment remains separate

The incoming service payment can be reconciled automatically. However, **Field Moderator payouts should not become automatic merely because an Agent paid AHC**. The existing hold remains correct: the system records the expected 80% share only after a service order is confirmed; the Admin releases or records the payout only after required property evidence, any second-verifier audit, and approval. Any future provider disbursement integration should be a separate, Admin-approved payout workflow with its own provider verification and audit trail.

## Recommended phased rollout

| Phase | Delivery | Admin-work reduction | Risk control |
|---|---|---|---|
| 0. Improve current manual process | Create unique AHC order codes and require them in payment narration; preserve Admin reconciliation. | Low to moderate. | No automatic entitlement. |
| 1. Hosted checkout | Integrate one Cameroon-capable, properly contracted provider checkout with return URL, signed webhook, and provider status lookup. | High for ordinary successful payments. | Auto-confirm only clean exact matches; exceptions remain with Admin. |
| 2. Wallet-native prompts | Add direct Mobile Money request-to-pay where the provider supports AHC’s merchant account and required compliance. | Higher conversion and lower Agent entry error. | Same server-side verification rule. |
| 3. Approved payout integration | Consider controlled Moderator payout initiation after Admin approval. | Reduces payout administration. | Never auto-payout solely on payment confirmation; require separate approval and payout-status verification. |

## Decision needed before implementation

AHC should select **one provider for the first release** after confirming merchant eligibility, Cameroon coverage, XAF support, settlement terms, KYC requirements, fees, webhook signing, refund support, and the availability of a production account. A hosted checkout is the lowest-risk first integration because it avoids handling wallet authentication in the AHC interface. MTN MoMo is a strategic direct option if AHC can obtain the appropriate merchant API access; a Cameroon-oriented aggregator may reduce initial integration work, but its exact support and commercial terms must be confirmed directly with that provider before committing.

Once a provider is chosen, the next implementation work is to add provider-payment fields and an immutable event ledger, create the server-only checkout and webhook procedures, introduce `needs_admin_review` as a protected Admin queue, add idempotency and webhook tests, and then use the provider sandbox before enabling live payments.

## References

[1]: https://momodeveloper.mtn.com/ "MTN MoMo Developer Portal"
[2]: https://developers.korapay.com/docs/mobile-money-apis "Kora — Accept Mobile Money Payment with APIs"
[3]: https://developer.notchpay.co/accept-payments/collect "Notch Pay — Collect"
