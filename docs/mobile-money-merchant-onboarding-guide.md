# AHC Mobile Money Merchant Onboarding Guide

## Purpose and boundary

Affordable Housing Cameroon currently accepts payment references only for **AHC platform services** such as Agent access, listing credits, promoted placement, and optional verification visits. It must never collect rent, deposits, agency fees, or any other tenancy settlement funds. The website already protects its current payment workflow: an Agent chooses **MTN MoMo** or **Orange Money**, submits a provider-specific reference, an Admin reconciles it, and a receipt becomes available only after a confirmation decision.

> **Important:** A developer login, test wallet, or ordinary personal MoMo/Orange Money account does not authorize a website to collect production payments. Live collection requires an approved merchant relationship with each provider and provider-issued technical credentials.

## Start here: merchant onboarding

Complete the business/merchant registrations before returning to AHC credential activation. The following sequence separates commercial approval from API integration so that the platform does not imply that a payment has succeeded until it can be independently confirmed.

| Order | Provider | Owner action | What to retain |
| --- | --- | --- | --- |
| 1 | MTN MoMo | Contact MTN Cameroon through a verified business channel or MTN MoMo Business support and request a **business merchant** account for Affordable Housing Cameroon. | Merchant ID, approval confirmation, settlement details, and the business contact assigned to the account. |
| 2 | Orange Money | Apply through [Orange Money Cameroon’s merchant page](https://orangemoney.orange.cm/en/om-parteners/become-a-merchant.html) or email `partenariat.OM@orange.com`. Request the merchant offer first, then ask for the **Web Payment / M Payment** product for the AHC website. | Merchant approval, Web Payment/M Payment approval, settlement details, and the technical contact. |
| 3 | Both providers | Confirm that the business account has been approved and can accept a small real customer payment under the provider’s guidance. | A dated confirmation or approved test result—never send AHC tokens, PINs, or passwords by chat. |

Orange Money’s official merchant page states that its offer provides a dedicated company account and indicates an operationalisation window of **two to fourteen days**. Its Web Payment / M Payment documentation says that the web-payment product is for registered, compliant merchants and is available in Cameroon. [1] [2]

MTN’s MoMo Business material describes merchant tools, including payment collaboration and invoicing, and lists **8400** as the Cameroon support number on its business portal. [3]

## What to request after approval

Ask each provider’s business or technical contact for the following, using their official secure onboarding channel. Do not place these values in a document, an email attachment, or chat message.

| Provider | Required activation information | AHC use |
| --- | --- | --- |
| MTN MoMo | Production collection product credentials, required subscription/product key, approved callback/notification URL contract, environment/currency confirmation, and provider guidance for testing. | AHC will initiate platform-service collection requests and independently validate the provider outcome before confirming an order. |
| Orange Money | Production Web Payment/M Payment credentials, API/notification contract, callback/return-url requirements, currency confirmation, and provider test-plan approval. | AHC will open the approved Orange payment journey and independently validate the returned provider outcome before confirming an order. |

When you have received any of those values, return to the AHC workspace and provide them through the protected settings request. The implementation will then add each provider **separately**, keep manual Admin reconciliation as a fallback, and perform a small controlled test before exposing automatic confirmation to Agents.

## What to do now

The immediate next action is to begin merchant onboarding rather than to change the website. Keep using the existing **payment reference → Admin reconciliation → receipt** procedure for real AHC platform-service payments during onboarding. That keeps an auditable record without falsely promising automated settlement.

## References

[1]: https://orangemoney.orange.cm/en/om-parteners/become-a-merchant.html "Orange Money Cameroon — Become a merchant"
[2]: https://developer.orange.com/apis/om-webpay "Orange Money Web Payment / M Payment"
[3]: https://momo.mtn.com/business/ "MTN MoMo Business"
