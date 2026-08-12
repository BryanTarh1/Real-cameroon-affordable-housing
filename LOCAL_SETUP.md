# Affordable Housing Cameroon — Local Setup

This package contains the **AHC full-stack source code**: React, TypeScript, Node.js, Express, tRPC, MySQL/Drizzle, and Leaflet. It deliberately excludes `node_modules`, deployment credentials, session secrets, and live production data.

## What you receive

| Area | Location | Purpose |
|---|---|---|
| Public interface | `client/` | Cost-first housing search, Leaflet landmark map, WhatsApp contact, trust explanations, and agent entry points. |
| Application server | `server/` | Express/tRPC application, listing queries, freshness archival handler, and authentication framework. |
| MySQL model | `drizzle/` | Drizzle schema and generated SQL migrations for listings, itemized costs, subscriptions, verification, featured pins, reports, differentiated onboarding, and structured field evidence. |
| Direct MySQL bootstrap | `database/ahc_local_bootstrap.sql` | Optional MySQL-client bootstrap that creates the local database and applies the current versioned migrations. |
| Demo database fixtures | `scripts/seed-temporary-demo.mjs` | Reusable, labelled non-production users, onboarding records, listings, payment states, and verification-evidence records. |
| Product rules | `shared/ahc.ts` | Reusable move-in-cost, freshness, phone-normalisation, WhatsApp-link, and approximate-location rules. |
| Original schema input | `reference/ahc_db.sql` | The database SQL supplied for the project, retained as a reference artifact. |

## Prerequisites

Install **Node.js 22 or later**, **pnpm 10**, and **MySQL 8 or later**. Any editor can be used; Visual Studio Code with the ESLint, Prettier, and Drizzle extensions is a practical choice.

```bash
node --version
corepack enable
pnpm --version
mysql --version
```

## 1. Unpack and install dependencies

Extract the archive, open the extracted folder in VS Code, then run:

```bash
pnpm install
```

## 2. Create a local MySQL database

From a MySQL administrator account, create a dedicated database and non-production user. Replace the example password before using it.

```sql
CREATE DATABASE ahc_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ahc_user'@'localhost' IDENTIFIED BY 'change_this_password';
GRANT ALL PRIVILEGES ON ahc_local.* TO 'ahc_user'@'localhost';
FLUSH PRIVILEGES;
```

The supplied original SQL is retained under `reference/ahc_db.sql`; it is reference material rather than the preferred migration path for this application version.

## 3. Create your local environment file

Copy the contents of `local-env.template.txt` to a new file called `.env` in the project root. Update the MySQL password and cookie secret; do not use the sample values outside local development.

```env
DATABASE_URL=mysql://ahc_user:change_this_password@127.0.0.1:3306/ahc_local
JWT_SECRET=replace_with_a_long_random_local_secret
```

> **Do not commit `.env`.** It is ignored because it contains local credentials.

## 4. Apply the AHC schema

Choose one of the two equivalent schema setup methods. The **Drizzle path** is preferred during development because it is what the project uses for future migrations:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

If you need to inspect the generated SQL first, check the new file in `drizzle/` before executing the migration command.

Alternatively, from the project root use the supplied MySQL-client bootstrap. It creates `ahc_local` and sources each tracked migration in order:

```bash
mysql -u ahc_user -p < database/ahc_local_bootstrap.sql
```

Do not use both methods on the same new database. After either method, you have the complete **current schema**, but no production data.

## 5. Optional: load clearly labelled demo data

The demo seed is optional and safe to re-run: it replaces only records marked with the `@test.ahc.local` domain or `demo-` identifiers. It contains no customer reviews, ratings, testimonials, live customer records, or real property evidence.

```bash
node scripts/seed-temporary-demo.mjs
```

The seed includes five local accounts, including the following supply-side examples:

| Account | State |
|---|---|
| `agent@test.ahc.local` | Ordinary `user` role with an approved Agent onboarding application. |
| `owner@test.ahc.local` | Ordinary `user` role with a submitted Owner onboarding application. |
| `moderator@test.ahc.local` | Field Moderator account with demo verification workflow access. |

The test passwords are documented in `AHC-Temporary-Test-Environment.md`. Change or remove them before exposing any local environment.

## 6. Run the development server

```bash
pnpm dev
```

Open the local address printed by the server, normally `http://localhost:3000`.

## 7. Verify the local build

```bash
pnpm test
pnpm check
pnpm build
```

| Command | Expected purpose |
|---|---|
| `pnpm test` | Validates AHC’s cost, freshness, privacy-coordinate, phone, and WhatsApp-link business rules. |
| `pnpm check` | Runs TypeScript type checking. |
| `pnpm build` | Produces a production build in `dist/`. |

## Authentication and local limitations

The public catalogue is designed for unauthenticated renters. Protected agent operations use the included Manus OAuth adapter. To test these locally, provide valid OAuth values in `.env` from your own configured environment. Otherwise, you can still work on the public search interface, map, itemized-cost display, and data model.

The platform-managed production scheduler is not bundled as a generic local cron service. The handler lives at `POST /api/scheduled/archive-stale-listings`; its caller must be a trusted scheduler identity. For a local prototype, invoke the archival database routine through a controlled script or test fixture instead of exposing this endpoint publicly.

## Product invariants to preserve

| Rule | Source location | Why it matters |
|---|---|---|
| Total Move-In Cash Required | `shared/ahc.ts`, `server/db.ts`, listing UI | Display base rent, advance, deposit, agency, service, and utility costs before a renter contacts an agent. |
| Approximate location | `shared/ahc.ts`, `ApproximateMap.tsx` | Publish a landmark-radius coordinate, not the compound door. |
| 14-day reconfirmation | `server/listingFreshness.ts`, `server/db.ts` | Remove stale units from public inventory after 14 days without agent reconfirmation. |
| WhatsApp-first connection | `shared/ahc.ts`, `server/routers.ts` | Direct renter-to-agent contact without in-app chat or upfront contact paywalls. |

## Recommended next local milestones

First, create a small test catalogue through the agent submission path. Then test two user journeys: a renter searches by maximum total move-in cash, and an agent reconfirms a listing before its freshness deadline. Finally, add an authenticated local admin before allowing agents to publish listings outside a controlled pilot.
