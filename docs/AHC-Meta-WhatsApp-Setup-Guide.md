# AHC WhatsApp Match Alerts — Owner Setup Guide

## What you are setting up

Affordable Housing Cameroon is ready to notify a renter **only when a Field Moderator has approved a home that matches the renter’s saved criteria**. The notification will show the verified listing title, location area, rent, Total Move-In Cash Required, and AHC property link.

The website does **not** need a paid WhatsApp provider. It needs an AHC-controlled Meta developer app, a WhatsApp Business sender, and one Meta-approved message template. You should own these assets under your own Meta account, so that the AHC sender and renter data stay under your control.

> **Time expectation:** Creating the developer app and testing with Meta’s test sender is normally a short setup task. Production business verification, phone-number activation, and template approval are controlled by Meta and can take longer. The website will keep alerts safely queued until activation is complete.

| Stage | What it enables | Cost / approval position |
|---|---|---|
| Meta developer app + test sender | You can test the technical connection with your own phone | Usually available immediately after account setup |
| AHC business sender | Real renters can receive AHC alerts | Requires a business-owned WhatsApp sender and Meta’s relevant checks |
| Approved template | AHC can notify opted-in renters outside an open chat window | Must be reviewed and approved by Meta |
| Website activation | AHC sends only consented match alerts and records status events | Completed after you securely supply the final configuration |

## Before you start

Use an email address and Facebook/Meta account that **you personally control**. Ideally, create or use a Meta Business Portfolio owned by Affordable Housing Cameroon. Keep your access token, App Secret, and any downloaded recovery codes private.

Do **not** send secrets in ordinary chat messages, screenshots, WhatsApp, or email. After you complete the steps below, return to this conversation and I will open a secure configuration form for them.

## Step 1 — Create or sign in to Meta for Developers

1. Open [Meta for Developers — My Apps](https://developers.facebook.com/apps/).
2. Select **Continue with Facebook** and sign in with the account that should own AHC’s Meta assets. If you do not have one, choose **Create new account** and complete Meta’s account process.
3. Accept any developer terms shown by Meta.

When you are signed in, you should see the **My Apps** page.

## Step 2 — Create the AHC developer app

1. Select **Create App**.
2. If Meta asks for a use case, select the option that connects with customers through **WhatsApp**. If that option is not shown, choose **Other** and then a **Business** app type; Meta occasionally changes the order of these screens.
3. Name the app **Affordable Housing Cameroon** or **AHC Match Alerts**.
4. Provide an AHC contact email address.
5. Select the AHC business portfolio if you already have one. Otherwise, create one when Meta prompts you.
6. Finish creating the app.

Record the app name. Do not send the App Secret yet.

## Step 3 — Add WhatsApp and test the sender

1. Inside the new app dashboard, locate **WhatsApp** and select **Set up** or **Get started**.
2. Open **API Setup**.
3. Meta should show a test WhatsApp phone number, a temporary access token, a test recipient field, and a Phone Number ID.
4. Add **your own WhatsApp number** as the test recipient and complete any verification code request.
5. Use Meta’s own sample-message test to confirm that the test sender can message you.

This confirms the Meta side works. The temporary token is useful only for a quick test and should **not** be used as AHC’s final production credential.

## Step 4 — Set up the AHC business sender for real renters

When the test sender is working, use the WhatsApp setup screens to add an AHC-owned phone number. Use a number that is dedicated to AHC alerts and support—not a personal number used by multiple people.

1. In the WhatsApp setup or WhatsApp Manager area, choose **Add phone number** or **Add business phone number**.
2. Enter the AHC display name and the dedicated sender number.
3. Complete the SMS or phone-call verification Meta requests.
4. If Meta requests business verification, complete it with authentic AHC legal/business information. Do not submit inaccurate information to speed up review.
5. Keep the resulting **Phone Number ID** available; it is required by the website.

| Keep for activation | Where you normally find it |
|---|---|
| Phone Number ID | App Dashboard → WhatsApp → API Setup |
| WhatsApp Business Account ID | WhatsApp Manager or Business Settings |
| Meta App ID | App Dashboard → Settings → Basic |
| Meta App Secret | App Dashboard → Settings → Basic; keep private |

## Step 5 — Create the approved renter-alert template

Meta requires an approved template for business-initiated messages outside a customer-service chat window. AHC uses this template only for renters who have explicitly enabled a private match alert. Meta documents that templates have to be approved before use and that template category, language, and variable format form part of the template definition.[1]

1. Open [WhatsApp Manager — Message Templates](https://business.facebook.com/latest/whatsapp_manager/message_templates).
2. Choose **Create template**.
3. Use the following values:

| Field | Enter this |
|---|---|
| Template name | `ahc_verified_home_alert` |
| Language | English (United States) — `en_US` |
| Category | Start with **Marketing** because this is a new-listing discovery alert; accept Meta’s final classification if it reclassifies it during review |
| Header | None |
| Body | Use the copy below |
| Footer | `You requested private AHC match alerts.` |

Copy this into the **Body** field, preserving the six numbered variables exactly:

```text
Hello {{1}}, a newly verified home matches your AHC alert.

{{2}}
{{3}}
Rent: {{4}} XAF/month
Total Move-In Cash Required: {{5}} XAF

Open the verified listing: {{6}}
```

For Meta’s requested sample values, you can use:

| Variable | Safe example |
|---|---|
| `{{1}}` | Amina |
| `{{2}}` | Two-bedroom apartment |
| `{{3}}` | Jouvence, Yaoundé |
| `{{4}}` | 75,000 |
| `{{5}}` | 300,000 |
| `{{6}}` | `https://affordableho-8aahm5dj.manus.space/property/123` |

Submit the template. Do not activate live alerts until its status is **Approved**. Meta’s documentation states that only approved templates can be sent and that status changes can be observed through Meta’s template status mechanisms.[1]

## Step 6 — Obtain the production credential correctly

After the app and sender are in place, create a long-lived production credential according to the options shown in your Meta business setup. This is commonly a system-user access token that has the WhatsApp messaging permissions needed for the AHC app. Meta lists `whatsapp_business_messaging` for message webhooks and `whatsapp_business_management` for management-related webhook access.[2]

The final production access token must be saved somewhere private. Do not paste it into chat. We will put it directly into AHC’s secure configuration after the server integration is ready.

## Step 7 — Return here with this non-secret status

When you have finished the above, reply with this checklist—not with the sensitive values themselves:

```text
Meta app created: yes/no
WhatsApp test message received: yes/no
AHC sender number added: yes/no
Template ahc_verified_home_alert status: Draft / In review / Approved
Production token created: yes/no
```

Once you confirm, I will give you AHC’s exact webhook callback URL and a secure form for the final secret values. The website will then be connected to Meta’s delivery-status events. Meta uses the `messages` webhook field for both incoming messages and the status of outbound messages, and can retry webhook deliveries—so AHC’s server will treat repeat events safely.[2] [3]

## What AHC will never do with this connection

AHC will not expose a seeker’s alert phone number to agents or landlords. It will not send match alerts without the seeker’s explicit opt-in. It will not award a **Responsive Host** badge until actual provider-backed response events can support it. The integration records operational status without publishing private phone numbers or message text.

## References

[1] [Meta for Developers, *Template fundamentals*](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview)

[2] [Meta for Developers, *Webhooks overview*](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview)

[3] [Meta for Developers, *Status messages webhook reference*](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status)
