# AHC Temporary Test Environment

> **Temporary non-production data only.** These accounts and records exist solely for owner testing. They must be removed before accepting real users, listings, or payment references.

## Login credentials

| Role | Email | Temporary password | Main route |
|---|---|---|---|
| Seeker | `seeker@test.ahc.local` | `Seeker#2026!` | `/` |
| Agent | `agent@test.ahc.local` | `Agent#2026!` | `/agent` |
| Field Moderator | `moderator@test.ahc.local` | `Moderator#2026!` | `/operations` |
| Admin | `admin@test.ahc.local` | `Admin#2026!` | `/admin` |

All four accounts use the AHC email-and-password form. They do **not** require a Manus account.

## Seeded workflow data

| Area | Temporary records created | What to check |
|---|---|---|
| Public search | One published, featured, physically verified Bastos listing | Set the search amount high enough to include its **450,000 XAF Total Move-In Cash Required**, then open it as a signed-out seeker to see the account gate. |
| Agent workflow | Active Agent Access, an available listing credit, paid listing history, and listings in `published`, `under_review`, and `changes_requested` states | Sign in at `/agent` and review the paid access, inventory, and correction states. |
| Payment reconciliation | Confirmed Agent Access, confirmed Listing Pass, a reference awaiting review, and confirmed physical-verification payment | Sign in as Field Moderator at `/operations` and inspect the payment queue. |
| Publication review | Submission, assignment, approval, and changes-requested review events | Use the Field Moderator review queue. |
| Physical verification | Passed Bastos verification with evidence note and active verified badge | Inspect the verification workflow and the related published listing. |
| Commission ledger | One accrued verification allocation: **7,500 XAF gross**, **6,000 XAF Field Moderator**, **1,500 XAF AHC** | Inspect the Moderator commission area and the Admin audit ledger. |
| Admin governance | Platform pricing, account controls, trusted-role assignment records, and cash-flow totals | Sign in as Admin at `/admin`; do not change the test roles unless you intend to test role reassignment. |

The fixtures are visibly labelled **`TEST DATA`** or **`DEMO`**. There are no fabricated ratings, reviews, testimonials, or customer claims.

## Verification sequence

1. Open `/` as a signed-out visitor. Search normally. Choose a budget at or above **500,000 XAF** if you need the published Bastos record to appear.
2. Open the published Bastos listing. The seeker account form should appear only at this detail step. Sign in as the temporary seeker to continue into the detail view.
3. Open `/agent` and sign in as the temporary Agent. Review the subscription, listing-credit, listing-status, and payment-history states.
4. Open `/operations` and sign in as the temporary Field Moderator. Review the reconciliation, listing-review, verification, and commission data.
5. Open `/admin` and sign in as the temporary Admin. Review governed fees, cash-flow totals, the commission ledger, bans, and trusted role assignment.

## Cleanup requirement

Run a full operational-data reset, or explicitly remove every account ending in `@test.ahc.local` and every record labelled `DEMO` or `TEST DATA`, **before public launch**. The reusable seed script is `scripts/seed-temporary-demo.mjs`; rerunning it replaces only its own clearly labelled fixture accounts and listings.
