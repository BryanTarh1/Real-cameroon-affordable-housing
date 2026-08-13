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
| Owner applicant | `owner@test.ahc.local` | `Owner#2026!` | `/agent` | Authenticated `user` with a dedicated **Direct Owner evidence under review** panel. The fixture has no Agent profile; it cannot access the lighter Agent profile or listing-submission paths while its Owner declaration is pending. |
| Field Moderator | `moderator@test.ahc.local` | `Moderator#2026!` | `/operations` | `moderator`; active moderator profile; can exercise Operations and route-batch controls |
| Admin | `admin@test.ahc.local` | `Admin#2026!` | `/admin` | `admin`; can exercise protected governance and role-management controls |

The reusable fixture is [seed-temporary-demo.mjs](../scripts/seed-temporary-demo.mjs). It recreates its own labelled `@test.ahc.local` accounts and related demo listings, payments, review events, verification evidence, and commission records. New fixture passwords are stored with bcryptjs rather than legacy scrypt.

## Direct Owner versus Agent boundary

An **Agent** is a representative. An Agent onboarding record requires government ID and proof of work, but a listing created through that capacity is permanently recorded as `agent_representative`. It cannot display the **Verified Direct Owner** signal merely because the representative says that they own the property.

A person who wishes to market a property as a **Direct Owner** must submit a separate identity, land-title, occupancy-right, and supporting-property package. While that declaration is submitted or changes are requested, the workspace removes the lighter Agent profile and listing-submission paths. Only an Admin may approve the documents in the protected `/admin` review queue, and approval records the Direct Owner capacity only for future listings. It does not self-assign a staff role, relabel historic Agent listings, or bypass the ordinary paid-access, moderator-review, and publication controls.

## Reset and cleanup

Running the fixture intentionally replaces its own labelled demo records. To remove this demonstration data from a non-production environment, delete the relevant `@test.ahc.local` accounts and their explicitly labelled related records through the approved reset/cleanup procedure. Do not use this fixture against a production database containing real marketplace records.
