# AHC Temporary Test Environment

> **Temporary non-production data only.** These accounts and records exist solely for owner testing. They must be removed before accepting real users, listings, or payment references.

## Login credentials

| Role | Email | Temporary password | Main route |
|---|---|---|---|
| Seeker | `seeker@test.ahc.local` | `Seeker#2026!` | `/` |
| Agent | `agent@test.ahc.local` | `Agent#2026!` | `/agent` |
| Owner applicant | `owner@test.ahc.local` | `Owner#2026!` | `/agent` |
| Field Moderator | `moderator@test.ahc.local` | `Moderator#2026!` | `/operations` |
| Admin | `admin@test.ahc.local` | `Admin#2026!` | `/admin` |

All five accounts use the AHC email-and-password form. They do **not** require a Manus account. The Owner applicant is an ordinary local `user` account; it is deliberately not an Admin, Moderator, or automatically trusted property owner.

## Seeded workflow data

| Area | Temporary records created | What to check |
|---|---|---|
| Public search | One published, featured, physically verified Bastos listing | Set the search amount high enough to include its **450,000 XAF Total Move-In Cash Required**, then open it as a signed-out seeker to see the account gate. |
| Agent workflow | Active Agent Access, an available listing credit, paid listing history, listings in `published`, `under_review`, and `changes_requested` states, and an **approved** Agent onboarding application | Sign in at `/agent` and review the paid access, inventory, correction states, and Agent identity-plus-work-proof application state. |
| Owner onboarding | One submitted, **pending** Owner onboarding application for `owner@test.ahc.local` | Sign in at `/agent` as the Owner applicant and confirm that the account is ordinary `user` access while its stronger identity, land-title, occupancy-right, and supporting-document package awaits review. |
| Payment reconciliation | Confirmed Agent Access, confirmed Listing Pass, a reference awaiting review, and confirmed physical-verification payment | Sign in as Field Moderator at `/operations` and inspect the payment queue. |
| Publication review | Submission, assignment, approval, and changes-requested review events | Use the Field Moderator review queue. |
| Physical verification | Passed Bastos verification with evidence note, active verified badge, and three structured proof records | Inspect the verification workflow and the related published listing. Each record includes a proof-image URL, evidence kind, factual observation, and listing-match assessment. |
| Commission ledger | One accrued verification allocation: **7,500 XAF gross**, **6,000 XAF Field Moderator**, **1,500 XAF AHC** | Inspect the Moderator commission area and the Admin audit ledger. |
| Admin governance | Platform pricing, account controls, trusted-role assignment records, and cash-flow totals | Sign in as Admin at `/admin`; do not change the test roles unless you intend to test role reassignment. |

The fixtures are visibly labelled **`TEST DATA`** or **`DEMO`**. There are no fabricated ratings, reviews, testimonials, or customer claims.

## Synthetic proof assets

The following files are synthetic, clearly non-production visual assets used only by the temporary seed. They do not represent a real property, person, title, or field visit. The relative URLs are deliberately stored with the demo records so authorised staff can test the structured-evidence workflow.

| Purpose | Relative storage URL | Seeded use |
|---|---|---|
| Exterior comparison image | `/manus-storage/ahc-test-evidence-exterior_345e18db.png` | Required exterior evidence item for the passed Bastos verification. |
| Living-room comparison image | `/manus-storage/ahc-test-evidence-living-room_b47fb09f.png` | Interior evidence item with a listing-match outcome. |
| Bathroom comparison image | `/manus-storage/ahc-test-evidence-bathroom_bafa9958.png` | Bathroom evidence item with a listing-match outcome. |
| Owner land-title preview | `/manus-storage/ahc-test-owner-land-title-preview_a6c75f83.png` | Synthetic document preview referenced by the pending Owner application. |

Do not reuse these assets as real property evidence, onboarding documentation, marketing photography, or public listing media.

## Fixture verification record

The reusable seed was checked against the application database after generation. The expected non-production state is shown below; this table is a verification aid for test runs and does not describe real applicants or real property evidence.

| Fixture | Expected status and proof package | Verification point |
|---|---|---|
| `agent@test.ahc.local` | Ordinary `user` role; Agent application **approved**; government-ID and work-proof references present; no Owner-only title/occupancy/supporting-document fields | Confirms an Agent receives the lighter, role-neutral onboarding path. |
| `owner@test.ahc.local` | Ordinary `user` role; Owner application **submitted**; government-ID, land-title, occupancy-right, and supporting-document references present | Confirms Owner registration remains an applicant workflow, not a staff or automatic ownership grant. |
| Bastos verification order `30001` | **Passed** with three evidence records: exterior **matches**, interior **matches**, bathroom **partially matches** | Confirms retained proof includes the mandatory exterior item, comparison outcomes, and a non-identical observation case. |

In the protected Operations workspace, the **Private evidence history** section renders those three records and their outcomes. A signed-out visitor cannot request the history; the backend returns `FORBIDDEN` for an ordinary user.

## Verification sequence

1. Open `/` as a signed-out visitor. Search normally. Choose a budget at or above **500,000 XAF** if you need the published Bastos record to appear.
2. Open the published Bastos listing. The seeker account form should appear only at this detail step. Sign in as the temporary seeker to continue into the detail view.
3. Open `/agent` and sign in as the temporary Agent. Review the subscription, listing-credit, listing-status, payment-history, and approved Agent onboarding state.
4. Sign out, then open `/agent` as `owner@test.ahc.local`. Confirm the pending Owner application and remember that this account is not granted Owner, Moderator, or Admin authority by registration.
5. Open `/operations` and sign in as the temporary Field Moderator. Review the reconciliation, listing-review, verification, commission data, and the three synthetic proof entries. The physical-verification form requires at least two proof URLs, one exterior evidence item, and a listing-match outcome before it enables passed or failed.
6. Open `/admin` and sign in as the temporary Admin. Review governed fees, cash-flow totals, the commission ledger, bans, and trusted role assignment.

## Cleanup requirement

Run a full operational-data reset, or explicitly remove every account ending in `@test.ahc.local` and every record labelled `DEMO` or `TEST DATA`, **before public launch**. The reusable seed script is `scripts/seed-temporary-demo.mjs`; rerunning it replaces only its own clearly labelled fixture accounts and listings.
