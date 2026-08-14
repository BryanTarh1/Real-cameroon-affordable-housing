# AHC Production-to-Local Testing Data: Safe Sync Design

**Status:** Design only. No connection to a user laptop or XAMPP database has been created.  
**Purpose:** Let the owner test locally with current marketplace data while keeping the deployed AHC database protected from local writes, credential exposure, and accidental deletion.

## The boundary

The deployed AHC project currently uses a managed cloud database. It contains operational tables such as users, local credentials, payments, reports, listing data, verification evidence, and audit records. A direct XAMPP connection with a production administrator account would be unsafe: a compromised laptop, accidental phpMyAdmin action, or buggy local test could read or alter live users and operational records.

> **Required rule:** Local testing must be one way—production may provide an approved testing snapshot to the laptop; the laptop must never write back to production.

Passwords, password hashes, login lock state, session data, payment references, raw contact information, exact compound locations, private verification evidence, payout information, and audit records must **not** be copied into a routine local testing database. AHC must continue to protect personal information and operational evidence.

## Viable approaches

| Approach | How it works | Trade-offs | Cost | Setup complexity |
|---|---|---|---:|---|
| **A. Sanitised snapshot download — recommended first** | An Admin-authenticated AHC export produces selected marketplace data with sensitive fields removed or anonymised. You download it and import it into a separate XAMPP database. | Not instant; you refresh it manually or on a sensible schedule. Safest and easiest to recover from. | No extra hosting required. | Low to medium. |
| **B. Read-only local pull sync** | A small local script, running on your laptop, calls a protected AHC export API and replaces only the local testing tables on a schedule. | Near-current test data, but your laptop must be on; needs a local token and initial setup. Still never exposes the cloud database directly. | No extra cloud service required. | Medium. |
| **C. Direct read-only cloud database account** | The managed database provider issues a dedicated account limited to `SELECT` on an approved read-only view; the laptop connects with TLS and a network allowlist. | Most current data, but creates a production network path to the laptop and depends on managed-provider support. Least suitable for early launch and local phpMyAdmin. | Provider-dependent. | High. |

## Recommended path: B after A

Start with **Approach A** to prove the field selection, anonymisation, local schema, and import process. Once that works, evolve it to **Approach B**: a local scheduled pull that retrieves the same sanitised export. This gives you current testing data without opening the cloud database port to your laptop or handing its credentials to XAMPP.

This is intentionally not a “live two-way sync.” A local test should never overwrite an actual Agent, Seeker, listing, payment order, field-verification record, or staff decision.

## What a safe testing export can include

| Data group | Include locally? | Local representation |
|---|---|---|
| Public approved listings and itemised public costs | Yes | Current public values; retain landmark-level, not exact-address, data. |
| Listing freshness, feature state, public badges, neighbourhood assessments | Yes | Current values needed to test browsing and ranking. |
| Agent plan state and listing-credit totals | Yes, with minimisation | Replace personal names, email addresses, phone numbers, and identity data with fixed test identities. |
| Seeker and Agent accounts | Only if needed | Anonymised test accounts without real email, phone, password hash, or session state. |
| Payment orders and receipts | Usually no | Use clearly marked fake local test records, never real provider references. |
| Moderator evidence, videos, exact access details, reports, commissions, and audit records | No routine export | Keep in production-only staff workflows; create dummy local fixtures if testing is needed. |
| Local credentials and password hashes | Never | Create separate local test passwords. |

## Proposed one-way pull workflow

| Step | AHC cloud application | Your laptop / XAMPP |
|---|---|---|
| 1. Request snapshot | A protected Admin operation creates a versioned, sanitised JSON or SQL snapshot. | No production DB connection. |
| 2. Authenticate download | A short-lived, single-purpose export token is checked server-side and rate-limited. | A local script keeps the token in a non-public configuration file outside `htdocs`. |
| 3. Download | AHC returns only the allowed export payload over HTTPS. | Script verifies version, signature/checksum, and schema version. |
| 4. Import safely | Nothing writes from local to production. | Script loads data into a dedicated database such as `ahc_local_test`, never the XAMPP default database. |
| 5. Confirm | AHC writes an export audit event without retaining unneeded local information. | Script prints data version and timestamp; failures leave the previous local snapshot intact. |

The local script should run **on demand at first**. If you later need automatic refresh, it can run hourly while the laptop is awake using the operating system scheduler. It should not push records back to AHC.

## What must happen before implementation

1. The owner must choose **sanitised snapshot only** or **sanitised snapshot plus scheduled local pull**. The direct database option is not recommended for this stage.
2. The owner must connect the laptop and bind a local folder containing the XAMPP project or a safe scripts folder. This is required before any local file, PHP configuration, or MySQL import can be created.
3. AHC must define the first allowed export fields and confirm whether local testing truly needs current Agent plan/credit data. The secure default is public listings only.
4. A new server-side export feature must be built, tested, and protected by an Admin-only authorization check. It will use a separate secret, audit every export, redact sensitive data, enforce rate limits, and never expose the managed database connection string.
5. The local importer will create a dedicated `ahc_local_test` database and use a local-only MySQL account with access to that database alone.

## Explicitly out of scope

This design does not expose the managed cloud database hostname, port, password, or administrator credentials. It does not replicate login sessions, password hashes, real payment records, tenancy money, or private verification evidence. It does not create a VPN, an open MySQL port, or a bidirectional replication channel.
