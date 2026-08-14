# Payment-Automation Research Notes

## Sources reviewed — 14 August 2026

- MTN MoMo Developer Portal: <https://momodeveloper.mtn.com/>
  - The public product overview describes merchant collection through real-time payment requests and invoices, together with payment-status capability. It also describes business disbursement capability.
- Kora Mobile Money API guide: <https://developers.korapay.com/docs/mobile-money-apis>
  - The documented sequence is merchant-created unique reference → customer wallet authorization → server-side transaction-status verification → webhook receipt.
  - The guide explicitly advises verification using the transaction reference after completion; a webhook is an event signal, not the sole basis for granting an entitlement.
- Notch Pay Collect guide: <https://developer.notchpay.co/accept-payments/collect>
  - The hosted-checkout flow returns a payment reference to the merchant callback URL, but its documentation still requires the merchant server to query the provider transaction endpoint and require the completed status before updating local records.

## AHC design implication

AHC should create every platform-service order before initiating provider payment; bind the provider reference and expected amount/currency to that immutable order; verify a webhook-triggered event against the provider’s status endpoint; and only then reconcile the AHC order automatically. Webhook signatures, idempotency, amount/currency matching, a short status-requery retry policy, and a manual exception queue are required. No rent, deposit, or tenancy transfer may enter this workflow.
