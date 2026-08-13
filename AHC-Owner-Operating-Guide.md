# Affordable Housing Cameroon — Owner Operating Guide

## Purpose

Affordable Housing Cameroon (AHC) is a **public rental-search marketplace with protected staff workspaces**. Seekers may search freely, then create or use a free AHC account only when opening a property detail. Supply-side applicants sign in before beginning the paid listing journey and submit an onboarding proof package appropriate to whether they are an Agent or an Owner. Field Moderators sign in before their work begins. An Admin governs pricing, staff authority, account safety, and audit records.

> **Important after the clean reset:** historic listings, orders, credentials, moderator profiles, and operational records were removed. The currently signed-in owner account is retained as the bootstrap Admin for private staff assignment. A newly created local AHC account always begins as an ordinary **user** account; it never self-assigns a staff role.

## Where each person goes

The following pages are separate application routes. They share one AHC domain and one database, but they do **not** share public navigation, interface controls, or permissions.

| Person | Page to open | Who can use it | What they can do |
|---|---|---|---|
| Seeker | `/` | Anyone may search; an AHC account is required only when opening a property detail | Search fresh homes and compare headline move-in costs before sign-in; after sign-in, view the full detail and use its WhatsApp contact option. |
| Agent | `/agent` | Anyone can register; only signed-in agents can manage inventory | Create an AHC account, pay for access, submit listings, track reviews, reconfirm availability, and request paid services. |
| Field Moderator | `/operations` | Anyone can reach the sign-in page; only designated `moderator` or `admin` staff can enter Operations | Sign in with an AHC account, then reconcile payments, review listings, inspect homes, issue or deny physical-verification badges, and view their own commission entries. |
| Admin | `/admin` | Designated `admin` staff only | Set launch prices and the commission split, assign trusted staff roles, audit confirmed cash flow, review commission records, and suspend or reinstate accounts. |

For the published site, add the route to the end of the domain, for example:

```text
https://affordableho-8aahm5dj.manus.space/agent
https://affordableho-8aahm5dj.manus.space/operations
https://affordableho-8aahm5dj.manus.space/admin
```

The **Admin page is a distinct, standalone page at `/admin`**. It is deliberately not presented in the public menu and should be shared only with the owner and carefully chosen Admins. The Field Moderator route is also standalone at `/operations`, but AHC visibly offers a **Field Moderator sign-in** entry from the public site. Keeping both workspaces in the same application avoids duplicate hosting and keeps one authoritative audit trail; strict server-side role checks, rather than a hidden URL, provide the actual security.

## 1. What a renter can do

Seekers do not pay AHC to search. They can browse fresh homes, filters, headline move-in costs, and approximate landmark areas without an account. A free AHC seeker account is required only when they choose to open a specific home's detail.

| Step | Renter action | What AHC shows or enforces |
|---|---|---|
| 1 | Open the home page. | The marketplace opens at the public route (`/`). |
| 2 | Enter a neighbourhood or landmark, choose Yaoundé or Douala, and set a maximum move-in budget. | Search prioritises **Total Move-In Cash Required**. |
| 3 | Select a listing card or map pin. | AHC opens a **Seeker access** prompt rather than the property detail. |
| 4 | Sign in or create a free AHC seeker account. | The account is an ordinary `user` account; no Manus account is required and it creates no staff authority. |
| 5 | Read the complete listing detail. | The detail shows the itemised costs, freshness information, and approximate landmark area. Pins use a **200–500 metre radius**, never a compound door location. |
| 6 | Start a WhatsApp conversation. | AHC opens a pre-filled WhatsApp link to the published agent; there is no in-app chat paywall. |
| 7 | Arrange a safe visit and decide independently. | AHC does not collect renter payments or guarantee a transaction. |

Only listings that remain available are intended to stay visible. Agents must reconfirm published availability every **14 days**; stale inventory is automatically removed from public search.

## 2. How a new agent starts from scratch

Agents now use an AHC-owned account. **A Manus account is not required.** The agent sign-in and registration panel is available at `/agent` and through the public **List a home** action.

| Step | Agent action | Result |
|---|---|---|
| 1 | Open `/agent`. | The paid agent workspace opens directly. |
| 2 | Choose **Create account**, select **Agent**, and enter name, email, password, government-ID URL, and proof-of-work URL. | AHC creates a local account with the ordinary `user` role and records the Agent onboarding application. It cannot grant Owner, Admin, or Moderator privileges. |
| 3 | Sign in and complete the profile. | Add the public agent name, optional agency name, and WhatsApp telephone number. |
| 4 | Create an **Agent Access** order. | The launch configuration is 3,000 XAF for 30 days and includes one Listing Pass. |
| 5 | Pay using AHC's official instructions and submit the MTN MoMo or Orange Money transaction reference. | The order stays inactive until authorised operations staff reconcile the evidence. A typed reference alone changes nothing. |
| 6 | Once the payment is confirmed, complete the listing form. | The form requires city, neighbourhood, public landmark, privacy radius, availability date, home type, and itemised costs. |
| 7 | Send the listing to review. | A paid listing credit is consumed and the listing becomes **under review**; it is not public yet. |
| 8 | Monitor the decision. | A moderator may approve and publish, request correction, or reject. A rejection restores the relevant listing credit. |
| 9 | Reconfirm published availability every 14 days. | Reconfirmation keeps a live listing fresh; inactive Agent Access prevents reconfirmation. |
| 10 | Optionally request a featured pin or physical verification after publication. | Both requests require the applicable paid order and staff reconciliation. A verification badge appears only after a passed field visit. |

### Supply-side onboarding: Agent and Owner requirements

An account is not a substitute for proof of authority to market a property. AHC therefore records a structured onboarding application when a supply-side person registers. **No document URL is exposed in public listing cards, maps, property detail, WhatsApp links, or public search.** These records are for authorised operational review only.

| Applicant type | Required onboarding proof package | Operational meaning |
|---|---|---|
| Agent | Government-ID document and proof of work | Establishes the person’s identity and a basic basis to operate as an Agent. |
| Owner | Government-ID document, land title, occupancy-right document, and supporting property document | Establishes a stronger property-rights package because the applicant represents themselves as the Owner. |
| Seeker | No documents | A Seeker can create a free account only to open a property detail; that account conveys no supply-side or staff authority. |

The application status is recorded as **submitted**, **approved**, **changes requested**, or **rejected**. The status is an operating-review record, not a public badge and not a staff role. Every self-service registration remains `user`; only an existing Admin can grant `moderator` or `admin` authority through **Trusted staff authority** in `/admin`.

> **Temporary test account only:** use `owner@test.ahc.local` with password `Owner#2026!` at `/agent` to inspect the pending Owner application. This non-production account and its synthetic document preview must be removed before accepting real users.

## 3. What happens after an agent submits a listing

The workflow protects renters from unreviewed or misleading inventory.

```text
Agent account and profile
        ↓
Paid Agent Access / Listing Pass
        ↓
Payment reference submitted
        ↓
Operations reconciles payment evidence
        ↓
Agent submits transparent listing
        ↓
Field Moderator reviews it
        ↓
Approve and publish  |  Request correction  |  Reject and restore credit
        ↓
Published agent reconfirms every 14 days
```

Before approval, the reviewer checks the declared costs, public landmark, availability, privacy radius, and policy compliance. Every review decision records the actor, reason, time, and resulting status, so there is an audit trail.

## 4. Where the Field Moderator page is and how it works

The person who physically checks a house uses:

> **Field Moderator workspace: `/operations`**

This page is a **separate staff workspace**. The public site includes a visible **For moderators** entry and Field Moderator sign-in call to action, but it never renders Operations controls to an ordinary visitor. An unauthenticated person who reaches `/operations` sees the Field Moderator sign-in screen. A signed-in ordinary user sees a clear message to ask the owner to assign the Field Moderator role. The server rejects protected Operations API requests unless the session is a `moderator` or `admin`.

Once the owner assigns an existing AHC account the `moderator` role, that person signs in through the AHC Field Moderator screen and the Operations page has three queues.

| Queue | Step-by-step Field Moderator workflow |
|---|---|
| Payment reconciliation | Open the submitted payment reference, check the supporting merchant evidence, record a meaningful note, then confirm or reject the order. Confirming creates the relevant paid access or credit; it does not automatically publish a listing. |
| Listing review | Open an under-review listing, inspect the agent identity, move-in-cost declaration, landmark-only location, availability, and compliance information. Assign it to yourself if needed, then approve and publish, request corrections, or reject with a reason. |
| Physical verification | Claim a paid request, arrange the visit, record factual field evidence without exact compound coordinates, then mark the visit **passed** or **failed**. Only a passed outcome applies the time-limited verification badge. |

For **every** passed or failed physical outcome, the Field Moderator must submit at least **two proof-image URLs**, including **one exterior comparison image**. Each proof item must identify its evidence kind, record a factual observation, and state whether it **matches**, **partially matches**, or **does not match** the submitted listing pictures and details. The Operations screen keeps the passed/failed controls unavailable until this threshold is met. The backend independently rejects an outcome that lacks two items or an exterior image. Proof documents and evidence are restricted to authorised staff workflows and must never be copied into the public property page.

The Field Moderator can also see a personal commission ledger for passed physical visits. The launch configuration allocates **80% to the Field Moderator and 20% to AHC** for each passed paid verification. These entries are immutable operational records; actual payout evidence should be retained separately.

## 5. Where the Admin page is and how it works

The platform owner or designated manager uses:

> **Admin workspace: `/admin`**

This too is a standalone, protected page—not an element mixed into the public marketplace. It is restricted to the `admin` role. An agent, renter, or moderator cannot see the Admin controls or call the privileged Admin APIs; the server returns an access-control error for those requests.

Once an authorised Admin signs in through the protected Admin route, the Admin workspace provides the following controls.

| Admin area | Step-by-step use |
|---|---|
| Commercial settings | Review and adjust the future price of Agent Access, Listing Passes, Featured Landmark Pins, and physical verification. The Admin may also set the Field Moderator commission share for future verified visits. Existing orders and historic allocations stay unchanged. |
| Cash-flow audit | Review totals for confirmed manual payments, physical-verification revenue, Field Moderator accruals, and AHC's verification share. This is an audit view, not a bank-settlement engine. |
| Commission ledger | Inspect every immutable allocation created from a passed paid physical verification, including the listing, moderator, gross amount, Field Moderator share, AHC share, status, and timestamp. |
| Account protection | Review account records and suspend or reinstate non-Admin accounts with a written reason. Admin accounts cannot be suspended from this page. |
| Trusted staff authority | Select an existing AHC account and deliberately assign **Seeker / Agent**, **Field Moderator**, or **Admin**. The server accepts this only from an Admin session, creates or activates the required Moderator profile, and writes an immutable audit event. An Admin cannot change their own role from this screen. |

## 6. What must be done now, after the reset

The public marketplace and agent registration are ready to use immediately. The reset intentionally removed the prior staff records, so Admin and Field Moderator routes exist but do not yet have authorised people behind them.

| Priority | Owner action | Why it matters |
|---|---|---|
| 1 | Use the retained owner Admin account to open `/admin`. | This is the private bootstrap account for staff authority. Keep it private and protect its access. |
| 2 | Ask each trusted Field Moderator or additional Admin to first create a normal AHC account. If a person is applying as an Agent or Owner, require the appropriate onboarding proof package as well. | Public registration creates a `user`, never a staff role. |
| 3 | In `/admin`, open **Trusted staff authority** and select the staff member's account. | Assign `moderator` for field work or `admin` for the limited people who should govern the platform. The change is audited. |
| 4 | Give Field Moderators the public **For moderators** entry or `/operations`; give additional Admins `/admin` privately. | The Field Moderator route shows its own AHC sign-in panel. The Admin route stays absent from public navigation. |
| 5 | Set the official MTN MoMo and Orange Money collection instructions before inviting agents. | Agents need legitimate payment details to settle orders and submit references. |
| 6 | Test one complete listing lifecycle. | Confirm payment → submit listing → review → publish → seeker account → WhatsApp contact → reconfirm. |

## Security boundary in plain language

The routes are intentionally discoverable only to authorised staff, but the route name is **not** the security feature. The server verifies the role associated with every protected request. Therefore, knowing `/admin` or `/operations` does not grant a renter or agent any ability to read financial data, confirm payments, approve a listing, issue a badge, alter settings, or manage accounts.

AHC local accounts use their own signed session and password protection. Seekers and agents may self-register, but every public registration begins with the ordinary `user` role. Staff authority is assigned only through the Admin-only trusted-role control. The Admin route is not a public navigation item.

## Quick answers

| Question | Answer |
|---|---|
| Where is the person who confirms whether a house is real? | The website visibly offers **For moderators**. That link leads to the protected **Field Moderator page: `/operations`**, where a trusted Moderator signs in and then claims paid field visits, records evidence, and decides passed or failed. |
| Where is the Admin page? | On the protected **Admin page: `/admin`**. It is a separate workspace screen in the same website, not mixed into public pages. |
| Can ordinary users see these pages? | They can see the **Field Moderator sign-in entry**, but never Operations controls. They cannot see an Admin link in public navigation. The server blocks all privileged API calls unless the user has the required role. |
| Can a new agent become Admin or Moderator through registration? | No. Local registration creates only an ordinary agent account. Staff roles must be provisioned intentionally. |
| Can a person become an Owner simply by choosing Owner during registration? | No. Choosing Owner creates an ordinary local account plus a submitted Owner onboarding application. Owner documentation is reviewed operationally and does not grant a staff role. |
| What proof is required before a physical-verification outcome? | At least two proof images, including one exterior image, with a factual observation and a listing-match assessment for each item. The requirement applies to both passed and failed outcomes. |
| Why use the same domain? | One domain and codebase reduce maintenance and preserve one audit trail. Security comes from strict backend role checks, not from running a second public website. |
| How do we add staff after the reset? | Each person first creates a normal AHC account. The retained owner Admin then opens `/admin` privately and uses **Trusted staff authority** to assign Moderator or Admin access. |

## 7. Premium verified discovery and alert operations

AHC’s premium presentation is built on **field evidence, not styling alone**. A premium walk-through, neighborhood-essential badge, cost-guarantee seal, and host credential must always be derived from recorded AHC data. Staff must never manually invent a badge, response-time claim, review, rating, location claim, or video record.

| Control | Mandatory operating rule | What a seeker sees |
|---|---|---|
| Moderator walk-through | For a **passed** physical verification, the assigned Field Moderator must capture and upload one unedited **vertical 15–30 second** MP4 or WebM on the claimed visit, together with the required proof images and a listing-match assessment. The server accepts only the assigned Moderator’s video and publishes it only after the pass. | A premium vertical walk-through rail that identifies it as Field Moderator-verified. Exact compound location remains protected. |
| Neighborhood essentials | The Moderator records only direct observations or cautious local assessments for water access, power, road access, approximate taxi walk, junction name, and travel minutes. “Not confirmed” is always allowed and must be used instead of guessing. | Compact practical badges, such as borehole observed, tarred road nearby, or a clearly qualified taxi-walk estimate. |
| Zero-Surprise Total Cash | The seal is available only to a live physically verified listing with no open inaccurate-cost or unofficial-fee concern. A new relevant report immediately removes the seal pending review. | A statement that the itemised move-in total is protected while the listing remains verified, plus a direct report path for added platform or dossier fees. |
| Direct-owner and transparency credentials | **Verified Direct Owner** is earned only from an approved Owner onboarding package. **Price-transparent record** is displayed only where there is no open cost-related report. AHC does not show invented star ratings, reviews, response times, or performance claims. | Evidence-based host credentials, never a fabricated reputation score. |
| Match alerts | A signed-in Seeker may opt in with a WhatsApp number and city/budget criteria. The number is kept for alert delivery only, may be revoked at any time, and is never shown to Agents or landlords. AHC queues a potential alert only after a listing is moderator-approved and matches the chosen criteria. | A private alert-preference panel and delivery history. Until a WhatsApp Business provider is configured, delivery remains explicitly marked **provider activation pending**. |

### WhatsApp alert activation boundary

Do **not** activate live WhatsApp messages through personal accounts, browser automation, or an unapproved messaging gateway. The owner must select and configure an approved WhatsApp Business provider with an authorised business account, recipient opt-in, an approved utility template, secure access credentials, delivery-status webhook verification, opt-out handling, and a documented retention policy. The implementation is intentionally provider-ready but does not send messages until that controlled configuration is completed.

> **Cost-protection rule:** AHC never asks a Seeker to pay a platform or dossier fee through an Agent. A legitimate AHC charge must be supported by an official AHC receipt code. Seekers should report a requested unofficial fee before paying it; staff must investigate the report fairly before any permanent account action.
