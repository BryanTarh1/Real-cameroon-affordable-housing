# MTN MoMo and Orange Money provider notes

## Scope boundary

AHC uses payments only for its own platform services: Agent access, listing credits, promoted listing placement, and optional physical-verification visits. It does **not** accept rent, deposits, agency fees, or tenancy settlement money.

## Verified provider considerations

MTN’s developer portal describes a payment-collection environment that relies on API workspace configuration and a configured callback URL. AHC must therefore use a dedicated provider adapter, a configured callback endpoint, provider-issued credentials, and signed or authenticated callback verification before automated confirmation can be enabled.

Orange’s official Web Payment documentation states that its Web Payment / M Payment service is available to merchants in Cameroon, but requires merchant subscription and compliance documentation. Orange also states that end users authenticate the payment with a one-time password obtained through its USSD flow. AHC therefore must not present Orange Money as automatically active until its merchant account, production credentials, and callback contract are approved.

## AHC activation contract

The application will retain its existing manual-reference and Admin-reconciliation path as the safe fallback. Automated provider confirmation will be enabled only per provider when all required credentials, configured callback URLs, and verification rules are present. AHC will normalize provider references, reject reuse across separate orders, and issue the official platform-service receipt only after an Admin or verified provider outcome confirms the order.

## Merchant-onboarding sequence for AHC

The owner has not yet opened either merchant account. Start with a registered business/merchant relationship rather than developer credentials: the developer portal or an app workspace alone does not authorize AHC to collect live payments.

1. For **MTN MoMo**, request MoMo Business merchant onboarding through MTN Cameroon business support or an official MTN channel. Once approved, retain the issued Merchant ID and confirm the merchant account can receive a small real customer payment. The MTN MoMo Business portal identifies Cameroon support at `8400` and lists merchant collaboration/invoice products.
2. For **Orange Money**, submit the Cameroon merchant request through `https://om.orange.cm` or contact `partenariat.OM@orange.com`. Orange describes its merchant offer as a dedicated company account and states a two-to-fourteen-day operationalisation window. After merchant approval, request the separate **Web Payment / M Payment** product for the AHC website/API; Orange’s official developer documentation limits that product to registered, compliant merchants.
3. Do not request or enter AHC production API secrets until each provider confirms the merchant/web-payment product and supplies its technical onboarding details. At that point, AHC will add each secret privately and use callback verification before enabling automatic confirmation.

## Provider information still required

| Provider | Business prerequisite | Technical prerequisite before live AHC collection |
| --- | --- | --- |
| MTN MoMo | Approved MTN MoMo Business merchant account | Provider-issued production collection credentials, subscribed product key, confirmed callback contract, and a successful small live acceptance test |
| Orange Money | Approved Orange Money Cameroon merchant account plus Web Payment / M Payment subscription | Provider-issued production credentials, confirmed production callback/notification contract, and a successful small live acceptance test |

## Sources

1. [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/), accessed 17 August 2026.
2. [Orange Money Web Payment / M Payment](https://developer.orange.com/apis/om-webpay), accessed 17 August 2026.
3. [Orange Money Web Payment FAQ](https://developer.orange.com/apis/om-webpay/faq), accessed 17 August 2026.
4. [MTN MoMo Business](https://momo.mtn.com/business/), accessed 17 August 2026.
5. [Orange Money Cameroon — Become a merchant](https://orangemoney.orange.cm/en/om-parteners/become-a-merchant.html), accessed 17 August 2026.
