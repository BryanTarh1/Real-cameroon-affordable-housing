# Affordable Housing Cameroon — Owner Operating Guide

## Purpose

Affordable Housing Cameroon (AHC) is a **public rental-search marketplace with protected staff workspaces**. Renters can search and contact agents without an account. Agents create their own AHC account to submit paid listings. Field Moderators verify properties and approve publication. An Admin governs pricing, account safety, and audit records.

> **Important after the clean reset:** all former accounts and operational records were intentionally removed. The website is ready for a fresh start, but there is currently **no active Admin or Field Moderator account**. A newly created local AHC account is an **agent account**, not a staff account.

## Where each person goes

The following pages are separate application routes. They share one AHC domain and one database, but they do **not** share public navigation, interface controls, or permissions.

| Person | Page to open | Who can use it | What they can do |
|---|---|---|---|
| Renter | `/` | Anyone | Search fresh homes, compare the full upfront cost, inspect an approximate landmark area, and start a WhatsApp conversation with an agent. |
| Agent | `/agent` | Anyone can register; only signed-in agents can manage inventory | Create an AHC account, pay for access, submit listings, track reviews, reconfirm availability, and request paid services. |
| Field Moderator | `/operations` | Designated `moderator` or `admin` staff only | Reconcile payments, review listings, inspect homes, issue or deny physical-verification badges, and view their own commission entries. |
| Admin | `/admin` | Designated `admin` staff only | Set launch prices and the commission split, audit confirmed cash flow, review commission records, and suspend or reinstate accounts. |

For the published site, add the route to the end of the domain, for example:

```text
https://affordableho-8aahm5dj.manus.space/agent
https://affordableho-8aahm5dj.manus.space/operations
https://affordableho-8aahm5dj.manus.space/admin
```

The **Admin page is a distinct, standalone page at `/admin`**. It is deliberately not presented in the public menu. The Field Moderator page is likewise a standalone page at `/operations`. Keeping them as protected routes in the same application avoids duplicate hosting and keeps one authoritative audit trail; strict server-side role checks, rather than a hidden URL, provide the actual security.

## 1. What a renter can do

Renters do not need an account and do not pay AHC to search or begin first contact. The public marketplace is intentionally centred on the amount required before moving in—not simply the monthly rent.

| Step | Renter action | What AHC shows or enforces |
|---|---|---|
| 1 | Open the home page. | The marketplace opens at the public route (`/`). |
| 2 | Enter a neighbourhood or landmark, choose Yaoundé or Douala, and set a maximum move-in budget. | Search prioritises **Total Move-In Cash Required**. |
| 3 | Open a listing card. | The listing shows itemised cost context, freshness, and an approximate landmark location. |
| 4 | Read the map and landmark information. | Pins use a **200–500 metre radius**, never a compound door location. |
| 5 | Start a WhatsApp conversation. | AHC opens a pre-filled WhatsApp link to the published agent; there is no in-app chat paywall. |
| 6 | Arrange a safe visit and decide independently. | AHC does not collect renter payments or guarantee a transaction. |

Only listings that remain available are intended to stay visible. Agents must reconfirm published availability every **14 days**; stale inventory is automatically removed from public search.

## 2. How a new agent starts from scratch

Agents now use an AHC-owned account. **A Manus account is not required.** The agent sign-in and registration panel is available at `/agent` and through the public **List a home** action.

| Step | Agent action | Result |
|---|---|---|
| 1 | Open `/agent`. | The paid agent workspace opens directly. |
| 2 | Choose **Create account** and enter name, email, and password. | AHC creates a local agent account with the ordinary `user` role. It cannot grant Admin or Moderator privileges. |
| 3 | Sign in and complete the profile. | Add the public agent name, optional agency name, and WhatsApp telephone number. |
| 4 | Create an **Agent Access** order. | The launch configuration is 3,000 XAF for 30 days and includes one Listing Pass. |
| 5 | Pay using AHC's official instructions and submit the MTN MoMo or Orange Money transaction reference. | The order stays inactive until authorised operations staff reconcile the evidence. A typed reference alone changes nothing. |
| 6 | Once the payment is confirmed, complete the listing form. | The form requires city, neighbourhood, public landmark, privacy radius, availability date, home type, and itemised costs. |
| 7 | Send the listing to review. | A paid listing credit is consumed and the listing becomes **under review**; it is not public yet. |
| 8 | Monitor the decision. | A moderator may approve and publish, request correction, or reject. A rejection restores the relevant listing credit. |
| 9 | Reconfirm published availability every 14 days. | Reconfirmation keeps a live listing fresh; inactive Agent Access prevents reconfirmation. |
| 10 | Optionally request a featured pin or physical verification after publication. | Both requests require the applicable paid order and staff reconciliation. A verification badge appears only after a passed field visit. |

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

This page is a **separate staff workspace**, not a public page. It is intentionally absent from the renter and agent navigation. If an ordinary visitor or agent types the URL, the application does not render moderator controls and returns the visitor to the public marketplace. The server also rejects protected Operations API requests unless the session is a `moderator` or `admin`.

Once a designated Field Moderator signs in through the existing staff-authentication path, the Operations page has three queues.

| Queue | Step-by-step Field Moderator workflow |
|---|---|
| Payment reconciliation | Open the submitted payment reference, check the supporting merchant evidence, record a meaningful note, then confirm or reject the order. Confirming creates the relevant paid access or credit; it does not automatically publish a listing. |
| Listing review | Open an under-review listing, inspect the agent identity, move-in-cost declaration, landmark-only location, availability, and compliance information. Assign it to yourself if needed, then approve and publish, request corrections, or reject with a reason. |
| Physical verification | Claim a paid request, arrange the visit, record factual field evidence without exact compound coordinates, then mark the visit **passed** or **failed**. Only a passed outcome applies the time-limited verification badge. |

The Field Moderator can also see a personal commission ledger for passed physical visits. The launch configuration allocates **80% to the Field Moderator and 20% to AHC** for each passed paid verification. These entries are immutable operational records; actual payout evidence should be retained separately.

## 5. Where the Admin page is and how it works

The platform owner or designated manager uses:

> **Admin workspace: `/admin`**

This too is a standalone, protected page—not an element mixed into the public marketplace. It is restricted to the `admin` role. An agent, renter, or moderator cannot see the Admin controls or call the privileged Admin APIs; the server returns an access-control error for those requests.

Once an authorised Admin signs in through the staff-authentication path, the Admin workspace provides the following controls.

| Admin area | Step-by-step use |
|---|---|
| Commercial settings | Review and adjust the future price of Agent Access, Listing Passes, Featured Landmark Pins, and physical verification. The Admin may also set the Field Moderator commission share for future verified visits. Existing orders and historic allocations stay unchanged. |
| Cash-flow audit | Review totals for confirmed manual payments, physical-verification revenue, Field Moderator accruals, and AHC's verification share. This is an audit view, not a bank-settlement engine. |
| Commission ledger | Inspect every immutable allocation created from a passed paid physical verification, including the listing, moderator, gross amount, Field Moderator share, AHC share, status, and timestamp. |
| Account protection | Review account records and suspend or reinstate non-Admin accounts with a written reason. Admin accounts cannot be suspended from this page. |

## 6. What must be done now, after the reset

The public marketplace and agent registration are ready to use immediately. The reset intentionally removed the prior staff records, so Admin and Field Moderator routes exist but do not yet have authorised people behind them.

| Priority | Owner action | Why it matters |
|---|---|---|
| 1 | Decide who will be the first AHC Admin. | This person will govern pricing, account protection, and audit records. |
| 2 | Provision that person as a trusted staff identity with the `admin` role. | A local agent registration cannot become an Admin by itself. |
| 3 | Decide who will conduct field checks in Yaoundé and Douala. | Each person needs a trusted staff identity with the `moderator` role. |
| 4 | Give each staff member the relevant protected route. | Admin: `/admin`; Field Moderator: `/operations`. |
| 5 | Set the official MTN MoMo and Orange Money collection instructions before inviting agents. | Agents need legitimate payment details to settle orders and submit references. |
| 6 | Test one complete listing lifecycle. | Confirm payment → submit listing → review → publish → WhatsApp contact → reconfirm. |

## Security boundary in plain language

The routes are intentionally discoverable only to authorised staff, but the route name is **not** the security feature. The server verifies the role associated with every protected request. Therefore, knowing `/admin` or `/operations` does not grant a renter or agent any ability to read financial data, confirm payments, approve a listing, issue a badge, alter settings, or manage accounts.

AHC local agent accounts use their own signed session and password protection. The local agent path is separate from the staff authentication path, and local agents always begin with the ordinary `user` role.

## Quick answers

| Question | Answer |
|---|---|
| Where is the person who confirms whether a house is real? | On the protected **Field Moderator page: `/operations`**. They claim paid field visits, record evidence, and decide passed or failed. |
| Where is the Admin page? | On the protected **Admin page: `/admin`**. It is a separate workspace screen in the same website, not mixed into public pages. |
| Can ordinary users see these pages? | No. Public navigation omits them. Unauthorised direct visits return to the marketplace, and the server blocks the associated APIs. |
| Can a new agent become Admin or Moderator through registration? | No. Local registration creates only an ordinary agent account. Staff roles must be provisioned intentionally. |
| Why use the same domain? | One domain and codebase reduce maintenance and preserve one audit trail. Security comes from strict backend role checks, not from running a second public website. |
| Why are there no staff records today? | The approved full reset removed all accounts and operational data. Staff identities must now be re-established deliberately. |
