# AHC Non-Production Test Accounts

**Purpose:** This reference identifies the deliberately created, non-production AHC accounts used to demonstrate access boundaries and marketplace states. Every account uses the `@test.ahc.local` domain and must be deleted or replaced before any public launch.

> **Safety boundary:** These credentials are for the AHC test database only. They are not customer accounts, are not approved operational staff accounts, and must never be reused for an owner, employee, Agent, Seeker, Field Moderator, or Admin in production.

## Account matrix

| Test position | Email | Password | Sign-in location | Intended state |
|---|---|---|---|---|
| Seeker | `seeker@test.ahc.local` | `Seeker#2026!` | Open a property, then use the seeker sign-in prompt | Authenticated `user`; can exercise protected seeker actions |
| Paid Agent | `agent@test.ahc.local` | `Agent#2026!` | `/agent` | Active Growth Agent; confirmed agent-access order; one unexpired, available listing credit; approved Agent onboarding |
| Paid Douala Agent | `agent-douala@test.ahc.local` | `AgentDouala#2026!` | `/agent` | Active Douala Agent fixture for city-specific inventory and paid-access checks; no available listing credits |
| Pending-payment Agent | `agent-pending@test.ahc.local` | `AgentPending#2026!` | `/agent` | Authenticated Agent profile with `pending_payment`; no confirmed access and no listing credits, to demonstrate the paid-access boundary |
| New Agent applicant (Ateh) | `owner@test.ahc.local` | `Owner#2026!` | `/agent` | Authenticated supplier account with no completed Agent profile, paid access, or listing credits. The retained test email is historical; the account follows the ordinary Agent setup route. |
| Field Moderator | `moderator@test.ahc.local` | `Moderator#2026!` | `/operations` | `moderator`; active moderator profile; can exercise Operations and route-batch controls |
| Admin | `admin@test.ahc.local` | `Admin#2026!` | `/admin` | `admin`; can exercise protected governance and role-management controls |

The reusable fixture is [seed-temporary-demo.mjs](../scripts/seed-temporary-demo.mjs). It recreates its own labelled `@test.ahc.local` accounts and related demo listings, payments, review events, verification evidence, and commission records. New fixture passwords are stored with bcryptjs rather than legacy scrypt.

## Unified supplier pathway

AHC uses one commercial supplier model: **Agent**. Property owners and representatives enter through the same Agent account, complete the same government-ID and proof-of-work onboarding, obtain paid Agent access and listing credits, and submit every listing to the ordinary Field Moderator review workflow.

AHC does not expose a separate Owner account, Owner evidence queue, or **Verified Direct Owner** badge. This keeps the supplier experience simple while preserving the operational controls that matter: explicit local sign-in, paid access, listing credits, itemised costs, first-publication review, physical verification, freshness reconfirmation, and safety-report controls.

## Reset and cleanup

Running the fixture intentionally replaces its own labelled demo records. To remove this demonstration data from a non-production environment, delete the relevant `@test.ahc.local` accounts and their explicitly labelled related records through the approved reset/cleanup procedure. Do not use this fixture against a production database containing real marketplace records.
