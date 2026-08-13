# Affordable Housing Cameroon: Roles and Authentication Reference

**Document status:** Operating reference for the current AHC application.  
**Audience:** Platform owner, authorised Admins, Field Moderators, Agents, Owners, and implementation reviewers.  
**Scope:** Identity, authentication, authorisation, provision, session boundaries, and prohibited access. This is a product and operational reference; it does not replace legal, privacy, or incident-response procedures.

## 1. Security position

Affordable Housing Cameroon separates **anonymous housing discovery** from **account-required actions** and from **staff-only operations**. A visitor may search fresh public inventory without an account. An AHC account is required for actions that affect another person, create a private record, or disclose protected contact details. A role-bearing AHC local session is required before any Agent, Field Moderator, or Admin workspace is rendered or its data is requested.

> A browser preview identity, a remembered interface value, or knowledge of a protected URL is **not** an AHC workspace credential. The application accepts only an explicit AHC local sign-in session for AHC authentication.

The application uses an AHC-issued JSON Web Token (JWT) stored in the `ahc_local_session` HTTP-only cookie. New and upgraded credentials use **bcryptjs** with work factor 12. Existing legacy scrypt values remain verifiable only to permit a one-time, successful-sign-in migration to bcrypt; the legacy value is then replaced. The implemented session and credential routines are defined in [localAuth.ts](../server/_core/localAuth.ts), while protected-procedure role checks are defined in [trpc.ts](../server/_core/trpc.ts).

| Control | Implemented rule | Operational purpose |
|---|---|---|
| Identity source | AHC local account and password, signed into explicitly through the AHC form | Prevents a preview or unrelated platform session from unlocking AHC workspaces |
| Password storage | bcryptjs; cost factor 12; no recoverable password value | Limits the impact of credential-store exposure |
| Session artifact | HS256 JWT with `provider: ahc_local`, user subject, and role claim | Binds a request to an AHC-issued account identity |
| Session transport | `ahc_local_session` cookie, HTTP-only, path `/`, `SameSite=None`; marked Secure for HTTPS requests | Keeps the token unavailable to client-side JavaScript and usable through the deployed HTTPS flow |
| Session lifetime | 30 days from issuance | Requires a new sign-in after expiry |
| Credential throttling | Five failed attempts lock the credential for 15 minutes | Reduces repeated password-guessing attempts |
| Logout | Server clears the AHC local-session cookie and client clears retired preview-state remnants | Ends the active browser session rather than merely hiding the interface |
| Server authorisation | `protectedProcedure`, `moderatorProcedure`, and `adminProcedure` independently validate identity and role | Prevents frontend routing from becoming the security boundary |

## 2. Role catalogue

AHC uses three stored roles: `user`, `moderator`, and `admin`. **Seeker** and **Agent** are controlled operating positions within the `user` role, distinguished by the action being performed and the relevant onboarding application. This design ensures that a public registration does not become a staff account.

| Position | Stored role | How the position is obtained | Can authenticate? | Primary permitted actions | Explicitly prohibited |
|---|---|---|---|---|---|
| Anonymous visitor | None | Visit the public website | No | Browse fresh listings, use filters, view landmark-area map information, review public cost totals and published trust signals | Full property detail, tracked WhatsApp lead, report, alert preference, viewing request, any workspace |
| Seeker | `user` | Public AHC account registration, then explicit AHC sign-in | Yes | Open protected listing detail, create a tracked WhatsApp lead, submit cost/availability or unofficial-fee reports, set consented match alerts, request a viewing | Supply listing inventory, access evidence, Operations, Admin, other users’ private records |
| Agent | `user` with Agent onboarding application | Public AHC registration with identity and proof-of-work references, then explicit AHC sign-in; access to paid capabilities depends on the platform’s commercial controls | Yes | Use `/agent`, submit itemised supply listings, manage credits and paid service orders, reconfirm listing freshness, manage own appointments | Self-assign staff roles, publish bypassing review, inspect private moderator evidence, use Admin or Operations tools |
| Field Moderator | `moderator` | An existing Admin deliberately assigns the Field Moderator role to a known AHC account; there is no public staff-registration form | Yes | Use `/operations` and `/operations/batches`, claim eligible verification work, submit structured proof and verification outcomes, complete authorised operational tasks | Change roles, platform settings, bans, payouts, or other Admin-only decisions; view data outside authorised operational scope |
| Administrator | `admin` | System owner or an existing authorised Admin deliberately assigns the Admin role; there is no public Admin-registration form | Yes | Use `/admin`; manage roles and bans; govern settings; review trust reports, safety holds, payments, audit evidence, appointments, and held commission approvals | Bypass server authorisation, treat a user report as proof without review, or receive/hold rent, deposit, agency commission, or tenancy-settlement funds |

## 3. Authentication and provision paths

The public website deliberately keeps anonymous search available. When a visitor attempts a protected seeker action, the interface prompts for an AHC account instead of starting an external sign-in flow. Agents may choose **Create account** or **Sign in** at the Agent entry. Field Moderator and Admin entries expose **Sign in only**; they never expose a public route to create a staff account.

| Position | Entry route or trigger | Permitted provision method | Sign-in result | If the account has the wrong role |
|---|---|---|---|---|
| Anonymous visitor | Public route `/` | None needed | Remains anonymous | Not applicable |
| Seeker | Protected action from a listing or trust feature | Public AHC seeker registration | Returns to the intended protected seeker action when valid | A standard `user` is the expected role |
| Agent | `/agent` or public supply call to action | Public AHC registration with identity and proof-of-work references | Opens only the user-scoped Agent area after sign-in | An unapproved or unpaid user receives the relevant business-status boundary, not staff access |
| Field Moderator | `/operations` or `/operations/batches` | Existing authorised Admin assigns `moderator` through the Admin workspace | Opens Operations only when the newly checked AHC session has `moderator` or `admin` | A signed-in `user` sees a clear assignment message; a signed-out visitor sees the Field Moderator sign-in form |
| Administrator | `/admin` | System owner or existing authorised Admin assigns `admin` through the Admin workspace | Opens Admin only when the newly checked AHC session has `admin` | A signed-in non-Admin sees a clear role-assignment message; a signed-out visitor sees the Admin sign-in form |

An Admin must first ensure the candidate has an AHC account, verify the candidate’s employment or operating relationship outside the role-assignment control, and then assign the role from the protected Admin workspace. The application records role changes in its Admin audit events. Staff must use their own accounts; shared passwords and shared browser sessions are not acceptable operating practice.

## 4. Protected routes and their entry boundaries

The following routes are intentionally on the same AHC domain so that they share the platform’s data and deployment controls. Their secrecy is not the security mechanism. Every protected route has a visible sign-in boundary and server-side procedure authorisation.

| Route | Browser behaviour before explicit AHC sign-in | Required role after sign-in | Data-query boundary |
|---|---|---|---|
| `/` | Public marketplace renders | None | Only public fresh-listing data is requested |
| `/property/:listingId` and protected seeker actions | Account prompt appears when an account-required action or detail is reached | `user`, `moderator`, or `admin` as an authenticated AHC account, subject to procedure rules | Protected contact, report, alert, and appointment procedures require authenticated context |
| `/agent` | Agent sign-in or registration panel appears before paid workspace controls | Authenticated `user` account with the relevant agent business status | Agent procedures validate the caller and only expose the caller’s records |
| `/operations` | Field Moderator sign-in-only panel appears | `moderator` or `admin` | Operations page queries are disabled until the correct role is present; procedures also require moderator authority |
| `/operations/batches` | The same Field Moderator sign-in-only panel appears | `moderator` or `admin` | Route-batch data is not mounted or queried for visitors and ordinary users |
| `/admin` | Admin sign-in-only panel appears | `admin` | Admin workspace is not mounted or queried for visitors, seekers, Agents, or Field Moderators |

The frontend route boundary improves clarity and avoids accidental data requests, but it is not sufficient by itself. The server reconstructs request context only from the valid AHC local JWT cookie and applies role middleware to each protected procedure. A manually typed URL, manipulated client state, or copied interface markup therefore does not grant data access.

## 5. Session lifecycle

### 5.1 Sign-in

The AHC form submits an email address and password to the local sign-in procedure. The server normalises the email, checks the credential lock, verifies the password, rejects banned accounts, clears previous failed-attempt state, and creates a new signed AHC JWT. A successful legacy-scrypt verification is immediately replaced with a bcrypt hash before the local session cookie is issued.

### 5.2 Role decision

The JWT carries a role claim for the session, while the server also obtains the current user record when authenticating the request. The role determines which workspace can render and which backend procedure can execute. An ordinary signed-in account cannot turn itself into `moderator` or `admin`; role changes remain an Admin-only action.

### 5.3 Expiry, logout, and lockout

The session expires after 30 days. The user should use the AHC logout action on a shared device or when leaving a staff workstation; logout clears the local session cookie and removes retired preview-derived browser state. Five unsuccessful password attempts produce a 15-minute lock on that local credential. The platform does not provide staff self-registration or a public staff password-reset bypass.

> **Operational rule:** If a staff member changes role, leaves the organisation, loses a device, or is suspected of credential compromise, an Admin should promptly remove or change the role, ban the account where appropriate, and instruct the person to sign out. Because an issued JWT has a fixed lifetime, a high-risk incident should additionally be handled through the platform’s formal incident-response process before relying on routine expiry.

## 6. Authorisation boundaries by activity

| Activity | Anonymous | Seeker / user | Agent | Field Moderator | Admin |
|---|---:|---:|---:|---:|---:|
| Search public fresh inventory | Yes | Yes | Yes | Yes | Yes |
| See protected contact or create tracked WhatsApp lead | No | Yes | Yes, only under normal authenticated flow | Yes, only where operationally appropriate | Yes |
| Submit seeker trust or fee report | No | Yes | No on behalf of another user | Oversight only | Review and act |
| Submit or reconfirm own listing | No | No | Yes | No | Oversight only |
| Claim field verification / route batch | No | No | No | Yes | Yes, where the procedure permits |
| Submit field proof / verification outcome | No | No | No | Yes | Oversight only |
| View verification evidence history | No | No | Only their relevant public/business status, not private evidence records | Yes, within Operations scope | Yes |
| Approve held Field Moderator commission | No | No | No | No | Yes |
| Change user role or ban status | No | No | No | No | Yes |
| Change governed platform settings | No | No | No | No | Yes |

## 7. Accountability and implementation checklist

The platform owner remains responsible for choosing trustworthy staff, reviewing role assignments, maintaining lawful privacy notices, and deciding how suspected compromise is handled. AHC’s technical controls support these duties but do not replace management oversight.

| Control owner | Routine responsibility |
|---|---|
| System owner | Maintain at least one recoverable Admin account, authorise initial staff roles, review access periodically, and retain incident contacts |
| Admin | Assign or revoke roles only after verification, review safety holds and evidence before irreversible action, and never share Admin credentials |
| Field Moderator | Use a personally assigned account, upload genuine field evidence, and avoid copying private property or seeker information outside authorised workflows |
| Agent | Protect their password, declare itemised costs accurately, and reconfirm live inventory within the required freshness window |
| Seeker | Use an AHC account for reports and contact requests, provide good-faith information, and report an exposed account promptly |

## 8. Implementation references

| Concern | Primary implementation reference |
|---|---|
| Password hashing, legacy migration detection, JWT issue and verification | [server/_core/localAuth.ts](../server/_core/localAuth.ts) |
| Request context limited to AHC local sessions | [server/_core/context.ts](../server/_core/context.ts) |
| Role middleware and backend procedure boundaries | [server/_core/trpc.ts](../server/_core/trpc.ts) |
| Local registration, login, logout, and role-assignment procedures | [server/routers.ts](../server/routers.ts) |
| Credential lockout and role-change persistence | [server/db.ts](../server/db.ts) |
| Browser request client with no preview bearer fallback | [client/src/main.tsx](../client/src/main.tsx) |
| Browser auth state and logout cleanup | [client/src/_core/hooks/useAuth.ts](../client/src/_core/hooks/useAuth.ts) |
| Admin and Field Moderator route gates | [client/src/App.tsx](../client/src/App.tsx) |
| Staff sign-in boundaries | [client/src/pages/AdminAccess.tsx](../client/src/pages/AdminAccess.tsx) and [client/src/pages/ModeratorAccess.tsx](../client/src/pages/ModeratorAccess.tsx) |

---

**Change record — 13 August 2026:** This reference accompanies the explicit-session hardening release. The release removes preview bearer-token authentication, accepts only AHC local JWTs for AHC request context, creates sign-in-only Admin entry at `/admin`, reuses sign-in-only Field Moderator entry at `/operations` and `/operations/batches`, preserves anonymous public browsing, and changes new local password hashes to bcryptjs while migrating verified legacy scrypt credentials on their next successful sign-in.
