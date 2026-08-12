# Execution checklist — Affordable Housing Cameroon

## Discovery and validation

- [ ] Select the first target segment and define its affordability problem precisely.
- [ ] Conduct interviews with seekers, owners, agents, moderators, and local partners in Yaoundé and Douala.
- [ ] Test the meaning of “affordable” using monthly cost, upfront cost, transport, utilities, and household income.
- [ ] Document the highest-risk fraud and trust scenarios.
- [ ] Define the pilot success metrics and stop/go decision rules.

## Supply and trust

- [ ] Recruit initial owners, agents, and institutional catalogue partners.
- [ ] Create listing intake and verification SOPs.
- [ ] Collect and verify a small initial catalogue before public launch.
- [ ] Define freshness, expiry, dispute, suspension, and escalation rules.
- [ ] Prepare user safety, privacy, and data-retention policies with local legal review.

## MVP

- [ ] Finalize the MVP scope and domain model.
- [ ] Design mobile-first search, listing, contact, reporting, and moderation flows.
- [ ] Implement authentication, listings, search filters, cost-of-entry display, contact protection, and moderation.
- [ ] Add analytics, error monitoring, audit logs, backups, and role-based access control.
- [ ] Test on low-end devices and slow mobile connections.

## Pilot and growth

- [ ] Launch a controlled pilot in selected neighborhoods in Yaoundé and Douala.
- [ ] Operate customer support and moderation daily during the pilot.
- [ ] Review funnel, quality, fraud, and successful-visit metrics weekly.
- [ ] Improve the product based on evidence rather than feature requests alone.
- [ ] Decide whether to expand cities, add partners, or revise the business model.

## Budget and financing

- [ ] Confirm whether the launch is founder-funded, grant-funded, investor-funded, or mixed.
- [ ] Confirm whether founders or local partners contribute time in kind.
- [ ] Collect at least three local quotes for development, field verification, moderation, and marketing.
- [ ] Separate one-time setup costs from recurring monthly operating costs.
- [ ] Set a 90-day cash reserve and a contingency percentage before committing to the pilot.
- [ ] Define the financial stop/go threshold for expanding beyond Yaoundé and Douala.

## Zero-capital validation and lean SRS

- [ ] Separate the no-cost validation service from the funded software MVP.
- [ ] Define the first narrow user segment and pilot neighborhood without paid acquisition.
- [ ] Create a manual listing and verification workflow using free tools.
- [ ] Define the minimum viable data fields and user-safety rules.
- [ ] Write the English SRS with functional and non-functional requirements.
- [ ] Draw the system context, core workflow, and data model diagrams.
- [ ] Define funding gates for 0 XAF, 100,000 XAF, and post-validation funding.
- [ ] Set measurable acceptance criteria for moving from manual validation to software development.

## Revenue-sharing business concept plan

- [ ] Extract each participant, payment trigger, revenue source, and payout rule from the supplied content.
- [ ] Separate proposed assumptions from validated Cameroon market facts.
- [ ] Model the closed-deal commission split, verification fees, escrow handling fees, and later revenue streams.
- [ ] Design diagrams for participant flow, money flow, payout split, and anti-leakage controls.
- [ ] Produce a professional Word document with editable narrative tables and embedded diagrams.
- [ ] Check all example calculations and label them as illustrative.
- [ ] Review the document visually before delivery.

## Second venture assessment integration

- [ ] Add the 7/10 venture-readiness assessment as an internal strategic evaluation, not a guaranteed score.
- [ ] Add the off-platform settlement loophole and monetary/digital-receipt countermeasures.
- [ ] Add moderator-agent collusion risk, random second-verifier audits, and payout-hold logic.
- [ ] Add licensed payment-partner requirement and prohibit custom escrow custody.
- [ ] Add geographic batching to improve moderator unit economics and reduce churn.
- [ ] Add updated diagrams for settlement protection, audit controls, and clustered verification.
- [ ] Regenerate and visually review the updated Word document.

## First interactive website version

- [ ] Re-read static web project guidance and inspect the current website files.
- [ ] Define the first dynamic public experience around searching trusted housing listings.
- [ ] Add realistic interactive listing filters, cost-of-entry calculations, and saved/search states.
- [ ] Add verification, report, contact, and participant-earning flows without implying backend persistence.
- [ ] Clearly label frontend-demo behavior and future backend requirements.
- [ ] Verify desktop, mobile, keyboard, and reduced-motion behavior.
- [ ] Save a checkpoint before delivering the first interactive version.

## AHC full-stack rebuild

- [x] Review the supplied `index.html` and the database file when provided.
- [x] Map the new requirements to the actual database schema and identify missing fields.
- [x] Replace the blueprint marketplace direction with the lightweight AHC stack and flows.
- [x] Implement itemized move-in cost calculation and primary display.
- [x] Implement approximate 200–500 m map coordinates and Leaflet markers.
- [x] Implement the protected 14-day `last_reconfirmed` archival handler and database logic.
- [x] Deploy the site and create the production Heartbeat job that invokes the archival handler daily (03:00 UTC; task UID `7fi5n9NWotqWsQtLAZMgrB`).
- [x] Implement WhatsApp deep-link contact flow.
- [x] Add agent subscription, featured pin, and physical verification surfaces.
- [x] Test and deliver the new downloadable website file set after the database is received.

## Local source package

- [x] Prepare a clean AHC source archive for local development without secrets or installed dependencies.
- [x] Add a Windows/macOS/Linux setup guide covering Node.js, MySQL, migrations, and development commands.
- [x] Inspect the archive contents and deliver the downloadable package.

## Paid launch and moderated publication

- [x] Audit the existing listing, subscription, promotion, verification, report, and authorization implementation.
- [x] Document the paid-from-day-one agent operating model and moderator approval lifecycle.
- [x] Replace free-tier language and flows with paid listing access, physical verification, and featured-pin offers.
- [x] Add moderator roles, review assignments, decision reasons, and immutable listing-review audit records.
- [x] Prevent agent self-publication; require approved payment and moderator approval before first publication.
- [x] Add a secure operations queue for review, approval, correction request, rejection, and physical-verification outcomes.
- [x] Add agent payment records, listing credit gating, and payment-reference capture pending provider reconciliation.
- [x] Add subscription-access checks, renewal reminders, and clear non-payment suspension states.
- [x] Strengthen the public trust page and listing disclosures for paid listing access, freshness, safety, and approximate location.
- [x] Test role restrictions, payment gating, review decisions, audit trail, freshness, and rendered mobile operations experience.
- [x] Add API-level test coverage for moderator review decisions and the immutable review-history endpoint.
- [x] Expose immutable listing-review history to authorized operations staff.
- [x] Add API-level tests for payment-reference reconciliation and listing-credit gating before moderator review.
- [ ] Complete a live signed-in mobile Admin walkthrough of payment, listing, verification, and audit controls after Manus human verification is available.
- [x] Fix the Vite WebSocket connection failure on the proxied Admin preview route and verify the browser console is clean.
- [x] Hide the Admin management interface from unauthenticated and non-Admin visitors while preserving server-side Admin API enforcement.
- [x] Add route-level and API-level regression tests proving only Admin users can reach management controls and privileged data.
- [x] Redirect unauthenticated and unauthorized visitors away from the Field Moderator operations workspace as well.
- [x] Add frontend route-boundary tests covering Admin and Operations redirects for unauthorized roles and access for permitted roles.
- [x] Document the Admin and Field Moderator authority boundaries, including the 80/20 physical-verification commission rule.
- [x] Add durable platform-setting, user-ban, and field-verification commission records to the data model.
- [x] Add protected Admin-only procedures for platform settings, user moderation, cash-flow audit, and commission audit.
- [x] Create an Admin workspace at `/admin` on the same domain with restricted access and clear operational controls.
- [x] Refine the Field Moderator workflow to show paid verification assignment, evidence, badge issuance, and the 80/20 commission record.
- [x] Keep the public marketplace focused on Total Move-In Cash search, WhatsApp contact, landmark-radius privacy, and relative freshness badges.
- [x] Add automated tests for Admin-only access, user-ban enforcement, cash-flow/commission audit data, and Field Moderator restrictions.
- [x] Add an Admin-only commission ledger with verification, moderator, allocation, status, and time details.
- [x] Display per-verification commission records to the corresponding Field Moderator and cover ledger access with automated tests.
- [x] Validate public, Admin, and Field Moderator routes on desktop and mobile before the final checkpoint.
- [x] Add an Admin-only cash-flow audit API test for confirmed revenue and recorded verification allocation totals.
- [x] Checkpoint and deliver the paid, moderator-controlled AHC website revision.
- [x] Block listing reconfirmation when Agent Access is inactive and explain the renewal requirement in inventory actions.
- [x] Add automated tests for paid-access expiration and reconfirmation guards.
- [x] Test paid-status expiry messaging and API-level rejection or acceptance of listing submission and reconfirmation by access state.
- [x] Add frontend unit coverage for the visible renewal countdown, suspended-state explanation, and renewal call to action.
- [ ] Diagnose the reported human-verification failure during signup and login, distinguishing external Manus verification failure from AHC OAuth callback/configuration failure.
- [ ] Add authentication regression coverage for failed verification/callback handling without weakening CSRF, nonce, or role protections.

- [ ] Complete the new human-verification troubleshooting and report whether the remaining blocker is external to AHC.
- [x] Trace the failed verification attempt through fresh preview, browser, network, and server diagnostics; no OAuth callback request reached AHC after the provider reported verification failure.
- [ ] Resolve or escalate the external Manus human-verification failure and re-run signup/login on a normal browser or published domain.
- [x] Define a secure AHC-owned agent authentication approach that does not require a Manus account.
- [x] Add AHC-owned email registration, sign-in, password security, and session handling for agents.
- [x] Preserve existing Admin and Field Moderator access while migrating agent identity away from Manus OAuth.
- [x] Update agent onboarding UI and documentation to explain independent AHC account creation.
- [x] Add tests for independent agent registration, sign-in, account bans, session authorization, and existing staff role restrictions.
- [x] Validate renter public access and independent agent onboarding on desktop and mobile.
- [x] Add explicit regression tests proving local-agent authentication does not weaken existing Admin and Moderator role restrictions.
- [x] Capture the AHC-owned agent onboarding panel at desktop and mobile widths and record the result.
- [x] Support a shareable public `?agent=1` entry point that opens the independent AHC agent onboarding panel without requiring Manus OAuth.

## Clean-start reset

- [x] Permanently reset all AHC operational database records after the owner's explicit confirmation.
- [x] Restart and verify the clean public preview after the reset.
