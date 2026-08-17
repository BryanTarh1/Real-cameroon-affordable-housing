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
- [x] Add the off-platform settlement loophole and monetary/digital-receipt countermeasures.
- [x] Add moderator-agent collusion risk, random second-verifier audits, and payout-hold logic.
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

## Protected workspace architecture review

- [x] Audit that Admin and Field Moderator tools are absent from public navigation and rendered only on standalone protected routes.
- [x] Verify backend role enforcement rejects unauthenticated and unauthorized Admin and Moderator API calls with the appropriate access-control error.
- [x] Verify direct navigation and refresh behavior for public, Admin, and Operations routes under the SPA server fallback.
- [x] Apply and test any route, navigation, or access-control hardening identified by the architecture review; no corrective change was required because the existing controls meet the reviewed requirements.

## Owner operating guide

- [x] Prepare a step-by-step owner guide for renters, agents, Field Moderators, and Admins, including protected-route access and post-reset account setup.

## Role-specific access flow

- [x] Let seekers browse public search without signing in and require an AHC account only when they open a property detail.
- [x] Add a visible Field Moderator entry point on the public website that requires sign-in before opening the protected Operations workspace.
- [x] Keep Agent entry and sign-in available from the beginning of the paid listing journey.
- [x] Keep the Admin route out of public navigation and allow Admin authority only through intentional trusted role assignment.
- [x] Add automated coverage for seeker detail gating, moderator entry behavior, and unchanged Admin role restrictions.
- [x] Validate the revised role-specific entry points on desktop and mobile and update the owner guide.

## Seeker flow test and staff access guidance

- [x] Exercise the public seeker flow from search through the property-detail sign-in prompt; anonymous search was run in the browser and the deferred prompt was verified by regression test because the clean database has no listing to open.
- [x] Provide the owner with tested Field Moderator login and dashboard-operation instructions.
- [x] Provide the private Admin URL and tested trusted-role-assignment instructions.
- [x] Deliver owner-facing Field Moderator sign-in steps and dashboard responsibilities, noting that the signed-out route was verified but a live staff walkthrough requires an assigned moderator account.
- [x] Deliver the owner-facing private Admin URL and role-assignment procedure, noting that role assignment has automated coverage but was not exercised through a live Admin session after the reset.

## Temporary test environment

- [x] Create clearly labelled non-production seeker, agent, Field Moderator, and Admin accounts with temporary credentials.
- [x] Create representative test records for listings, payment reconciliation, publication review, field verification, and the 80/20 commission ledger without adding reviews or testimonials.
- [x] Verify the temporary role accounts and visible workflow states in the preview.
- [x] Deliver temporary credentials and an explicit post-test cleanup warning to the owner.

## Evidence-based verification and differentiated supply onboarding

- [x] Require Field Moderators to record structured in-person property evidence, including comparison against the listing photos and details, before issuing a passed or failed verification outcome.
- [x] Display moderator evidence and listing-match outcomes to authorized staff without exposing private proof documents publicly.
- [x] Add stronger Owner onboarding requirements for identity, land-title, and supporting property documents than the Agent identity and work-proof requirements.
- [x] Keep self-service registration from granting Owner, Moderator, or Admin authority; require trusted Admin review and role assignment.
- [x] Generate clearly labelled non-production property-evidence and document-preview images for the demo environment.
- [x] Extend the reusable temporary seed with Owner and Agent onboarding records plus moderator evidence, comparison outcomes, and proof-image references.
- [x] Add automated tests and desktop/mobile validation covering evidence capture, outcome gating, onboarding requirements, access boundaries, and seeded demo workflows.
- [x] Update the owner operating guide and temporary test-environment reference with the revised verification and onboarding process.

## Local source and database export refresh

- [x] Prepare a clean current source archive containing the React, TypeScript, CSS, server, migration, and configuration files without secrets or dependencies.
- [x] Prepare a portable MySQL schema-and-demo-data SQL package using the current Drizzle migrations and clearly labelled non-production fixtures.
- [x] Update local setup instructions for importing the supplied SQL package and running the application.
- [x] Inspect the archive and SQL package for completeness, portability, and secret-free contents before delivery.

## Reusable workflow skill and usability improvements

- [x] Create and validate a reusable skill for packaging a full-stack AHC-style source and MySQL database delivery without secrets.
- [x] Add a persistent accessible dark-mode preference and visible theme toggle across public and protected AHC interfaces.
- [x] Add a protected CSV export action for an authorised records table, with correct field escaping and no private evidence URLs.
- [x] Add clear pending states, loading spinners, and success/error toast feedback to the relevant form and workflow submissions.
- [x] Add regression tests and desktop/mobile visual validation for the new theme, export, and submission-feedback behaviors.

## Trust-risk response and operating-controls assessment

- [x] Assess the ghost-listing, off-platform payment, moderator-fraud, map-privacy, WhatsApp-lead, total-cash, and direct-link risks against the current AHC implementation.
- [x] Add an authenticated seeker-facing inaccurate-cost report flow with automatic listing safety action after three distinct reports.
- [x] Add privacy-preserving WhatsApp lead-event logging before redirecting a seeker to an Agent or Owner contact.
- [x] Add an Admin review surface for cost reports and lead-event evidence without exposing personal data publicly.
- [x] Document the complete risk-response analysis, current controls, limits, and operational procedures in a Word document.
- [x] Add regression tests and responsive validation for the new reporting, lead-tracking, and Admin-review workflows.

## Launch-control hardening

- [x] Add Admin-facing reporting-account context and clustered-report warnings so automatic safety holds are investigated fairly before any permanent sanction.
- [x] Require Admin evidence review before a Field Moderator commission record can move from held to payable.
- [x] Add safe property-specific OpenGraph metadata for direct listing links without exposing exact locations, documents, evidence, or contact details.
- [x] Add regression tests and responsive validation for report integrity, payout approval, and property-share metadata behavior.
- [x] Update the risk-response operating guide and Word report with the new launch safeguards.

## Premium trust-led marketplace upgrade

- [x] Define a moderation-first 15–30 second vertical walk-through video standard, including privacy, retention, and publication eligibility.
- [x] Add stored Field Moderator video evidence and structured neighborhood-essentials observations to the listing-verification data model.
- [x] Require an eligible moderator-captured vertical walk-through video before a listing can receive the premium verified-video presentation.
- [x] Add a premium vertical video discovery experience alongside the standard home search without exposing exact compound locations.
- [x] Add verified neighborhood essentials and commute badges for water, power, road access, taxi-walk context, and junction proximity.
- [x] Add a rules-based Zero-Surprise Total Cash seal that revokes eligibility on a relevant open pricing or unofficial-fee concern pending fair staff review.
- [x] Add evidence-based Verified Direct Owner and price-transparency badges without fabricating reviews, ratings, or response metrics.
- [ ] Add a Responsive Host badge only after provider-backed WhatsApp response events can substantiate it.
- [x] Add authenticated seeker match-alert preferences with explicit WhatsApp consent, preference controls, and an auditable delivery queue.
- [ ] Assess and configure an approved WhatsApp Business delivery provider before enabling live outbound alert messages.
- [x] Trigger or queue consented match alerts only after a moderator-approved listing becomes publicly available.
- [x] Extend automated tests and responsive visual checks for the premium listing workflows.
- [ ] Extend the optional temporary demo fixture with a real, clearly-labelled non-production vertical test video before using it for premium-video demonstrations.
- [x] Update the owner operating guide and risk-response documentation with premium evidence, alert, and badge operating rules.

## Meta WhatsApp Cloud API activation

- [ ] Record the required Meta Cloud API credentials, approved utility-template name, and webhook subscription requirements without storing secrets in source control.
- [ ] Add server-side Meta Cloud API delivery for eligible provider-pending match-alert records, with idempotency, timeouts, and auditable provider message references.
- [ ] Add a verified Meta webhook endpoint that validates the subscription challenge and authenticates signed delivery and message events.
- [ ] Process Meta delivery-status and incoming-message events into the alert audit record without exposing seeker phone numbers or message content publicly.
- [ ] Define an evidence-based Responsive Host badge from real, consent-aware WhatsApp response timing rather than inferred or fabricated activity.
- [ ] Add automated tests for disabled-provider safety, template delivery, webhook verification, signature rejection, delivery transitions, and responsiveness eligibility.
- [ ] Update configuration and owner documentation with the exact Meta Business setup, template approval, webhook registration, and privacy obligations.

## Non-custodial payment safety

- [x] Audit public, Agent, moderator, and payment-order interfaces for language or flows that could imply AHC holds rent, deposits, or third-party settlement funds.
- [x] Add prominent non-custodial payment disclosures and guardrails to relevant AHC workflows.
- [x] Define the required approval gate for any future partner-mediated payment capability and prohibit arbitrary custom escrow handling.
- [x] Add regression coverage and owner operating guidance for payment-custody boundaries.

## Field Moderator geographic batching

- [x] Define batch eligibility using only approved verification work, city, neighborhood/landmark area, and safe date windows.
- [x] Add protected moderator-only query services that group eligible verification work by practical route area without revealing exact doors before assignment.
- [x] Add a Field Moderator route board with batch counts, approximate areas, estimated verification earnings, and accountable claim actions.
- [x] Preserve assignment, conflict, audit, and second-verifier safeguards when work is claimed from a geographic batch.
- [x] Add regression tests, responsive review, and operating-guide rules for geographic batching.

## Provider-independent premium refinement

- [ ] Keep live Meta WhatsApp alert delivery and Responsive Host evaluation disabled until the owner completes Meta account verification and provides approved credentials.
- [x] Add a clearly labelled, non-production vertical walk-through demonstration fixture so the premium video experience can be reviewed without representing synthetic material as a real available home.
- [x] Verify the premium discovery experience with the labelled demonstration fixture and retain the same evidence threshold for every real verified listing.

## Premium viewing appointment concierge

- [x] Define appointment eligibility, privacy, cancellation, no-show, and contact-disclosure rules for verified live listings.
- [x] Add appointment persistence and protected seeker, Agent, Moderator, and Admin data access boundaries.
- [x] Allow authenticated seekers to request a time window and private contact preference from an eligible property detail.
- [x] Allow the responsible Agent to confirm, decline, cancel, or record a viewing outcome without revealing exact access details before confirmation.
- [x] Add accountable appointment histories for the seeker and Agent, plus Moderator/Admin oversight limited to operationally necessary data.
- [x] Add abuse controls for duplicate requests, stale listings, suspended accounts, inappropriate transitions, and time-window validation.
- [x] Add regression tests, responsive checks, and operating-guide instructions for the viewing appointment workflow.

## Refreshed trust and operating guide

- [x] Refresh the AHC risk-response operating guide with the completed premium video, appointment, non-custodial settlement, and geographic-batching safeguards.
- [x] Add deterministic diagrams for non-custodial settlement boundaries, verification/audit/payout assurance, and privacy-preserving route batching.
- [x] Regenerate and visually review the revised Word operating guide for readable diagram placement and coherent controls.

## Explicit role authentication and access reference

- [x] Audit local JWT/session restoration, logout, and route guards to identify why protected workspaces can appear available without an explicit sign-in action.
- [x] Require an explicit valid Agent session before the paid Agent workspace renders or any Agent action is queried.
- [x] Require an explicit valid Field Moderator or Admin session before Operations controls and Field Moderator route batching render or query data.
- [x] Require an explicit valid Admin session before the Admin workspace renders or queries data.
- [x] Preserve anonymous public browsing while requiring a seeker account for property details, reports, WhatsApp lead tracking, match alerts, and viewing requests.
- [x] Ensure all protected backend procedures remain role-authorized independently of frontend route guards and clear local sessions on logout.
- [x] Add authentication regression tests and desktop/mobile protected-route checks for signed-out, wrong-role, and valid-role states.
- [x] Create a clear web document describing every platform role, provision path, authentication method, permissions, session boundary, and prohibited access.

## Verified varied non-production accounts

- [x] Audit the current database for the previously supplied AHC test accounts and their actual role, credential, paid-access, and listing-credit state.
- [x] Create or repair clearly labelled non-production Seeker, Agent, Owner applicant, Field Moderator, and Admin accounts with distinct passwords and valid bcrypt-backed local credentials.
- [x] Configure one named non-production Agent with active paid access, reconciled platform-service payment, and usable listing credits; retain a contrasting Agent state where useful for testing.
- [x] Validate each credential against the local sign-in path and verify the intended role-specific workspace or business-access boundary.
- [x] Update the non-production test-account reference, checkpoint the fixture update, and deliver the exact verified credentials with a cleanup warning.

## Local sign-in regression repair

- [x] Trace the reported browser-facing “Invalid email or password” response through the local login request, database lookup, and password verification path.
- [x] Correct the identified fixture, input-normalisation, client-request, or authentication implementation mismatch without weakening access control.
- [x] Add focused regression coverage and validate an actual browser-facing local sign-in for a paid Agent and a staff role.
- [x] Checkpoint the sign-in repair and provide the verified credentials and route-specific test steps.

## Marketplace discovery, link resilience, and operating guide

- [x] Audit the current Walk-Thru video discovery rail, property detail routing, WhatsApp lead tracking, social metadata, and public-versus-private evidence boundaries.
- [x] Rename the labelled non-production actors to Bryan, Robinson, Ebot, and Tarh while preserving distinct roles, passwords, and paid versus pending Agent states.
- [x] Assign each additional required non-production actor a unique realistic name and document its defined role, access boundary, and fixture purpose.
- [x] Expand the clearly labelled non-production database fixture with a realistic, varied set of fresh Yaoundé and Douala listings without fabricating reviews or testimonials.
- [x] Add an accessible “View full home details” action to each eligible Walk-Thru video that opens the associated property flow.
- [x] Ensure every eligible property detail includes a tracked “Chat on WhatsApp” path that records consented lead intent before the direct WhatsApp handoff.
- [x] Make direct property links resilient to refresh and sharing, and ensure server-rendered social metadata contains only public listing information.
- [x] Verify public cards expose only approved public trust signals and relative freshness while Field Moderator proof and audit records remain confined to protected staff routes and procedures.
- [x] Add regression tests plus desktop and mobile validation for video detail navigation, tracked WhatsApp leads, link metadata, and staff-evidence privacy.
- [x] Produce a detailed Word operating guide covering every user level, route, workflow, control, and platform functionality.
- [x] Checkpoint the release and deliver the updated site and operating guide.

## Hash-route internal navigation correction

- [x] Convert remaining public and protected internal navigation links and route-sensitive controls to hash-route-safe forms, then validate staff-route entry and Admin-only controls.

## Guided role-by-role acceptance walkthrough

- [x] Map the current non-production roles, credentials, routes, fixture states, and safe test order for a live owner-led acceptance exercise.
- [x] Build an in-site guided acceptance checklist that teaches anonymous visitor, Seeker, Agent, Owner applicant, Field Moderator, and Admin workflows while recording expected outcomes.
- [x] Include explicit privacy, payment, evidence, and safety-boundary checks with a clear action to take when an expected result does not occur.
- [x] Validate the walkthrough content against the current fixtures and protected-route rules on desktop and mobile.
- [x] Update the owner-facing operating materials, checkpoint the walkthrough, and guide the owner through the first complete pass.

## Signed-in Seeker Walk-Thru video repair

- [x] Trace why an eligible listing’s Walk-Thru video is absent from the signed-in Seeker property-detail view.
- [x] Correct the verified-video data association or detail-rendering path while preserving the protected evidence boundary.
- [x] Add regression coverage and validate that a signed-in Seeker can view the approved Walk-Thru and return to full listing details.
- [x] Checkpoint the repair and resume the guided Seeker acceptance step with the owner.

## Complete non-production account roster

- [x] Verify every current named non-production account, credential, assigned role, access state, and test purpose against the reusable fixture source and database.
- [x] Deliver the complete role-by-role non-production credential reference with the correct entry route and a test-only security warning.

## Visible session logout and account switching

- [x] Audit every authenticated public and protected navigation shell for a visible AHC logout action and confirm the existing server-side session termination path.
- [x] Add a clear accessible logout control to the marketplace, Agent, Field Moderator, Admin, and owner acceptance entry points.
- [x] Add regression coverage and validate that logout clears the local session, returns the user to a safe public or sign-in boundary, and allows a different role to sign in.
- [x] Checkpoint the logout repair and resume the owner-led role acceptance walkthrough.

## Agent listing freshness visibility

- [x] Inspect the Agent listing query and card renderer for the current last-reconfirmed data available to the interface.
- [x] Add a read-only last-reconfirmed date and 14-day days-remaining freshness indicator to each Agent listing card without changing listing state.
- [x] Add regression coverage and validate the freshness status on desktop and mobile Agent cards.
- [x] Checkpoint the freshness-display improvement and resume the Ebot Agent acceptance step.

## Ebot paid-Agent credential regression

- [x] Compare the documented Ebot local credentials with the currently seeded paid-Agent fixture and sign-in flow.
- [x] Repair any verified password, fixture, or login-path regression while preserving Ebot’s paid access and listing credits.
- [x] Verify an Ebot local sign-in reaches the Agent workspace and confirms the expected paid-Agent state.
- [x] Checkpoint the credential repair and resume the Agent acceptance walkthrough with the verified sign-in details.

## Owner onboarding and Agent-path boundary

- [x] Inspect why the Owner-applicant fixture does not present a discoverable Owner document area and trace current server-side listing eligibility rules.
- [x] Define the correct Owner-versus-Agent classification, declaration, and evidence requirements without falsely assuming every Agent is an Owner.
- [x] Add a discoverable Owner onboarding path and enforce server-side restrictions that prevent a declared Owner from publishing through the lighter Agent evidence path.
- [x] Add regression coverage for Owner evidence requirements, Agent-path bypass prevention, and Owner-applicant workspace visibility.
- [x] Update the acceptance walkthrough, validate the role boundary, checkpoint the correction, and resume the owner-led test.

## Unified Agent supplier workflow

- [x] Audit the recently added Owner-specific interfaces, procedures, schema fields, fixtures, and documentation for consolidation into Agent operations.
- [x] Replace the separate Owner onboarding experience with a unified Agent supplier pathway while preserving paid listing, moderation, evidence, and safety rules.
- [x] Remove obsolete Owner-specific declarations, trust labels, review queues, and acceptance guidance without weakening protected staff controls.
- [x] Add regression coverage and validate that every supplier uses the Agent workspace and protected publishing workflow.
- [x] Checkpoint the unified Agent workflow and provide the completed product update.

## Field Moderator commission visibility

- [x] Inspect whether Robinson has eligible held-commission data and whether the Operations workspace renders its commission state.
- [x] Add a protected read-only commission status view or clear empty state if the current Moderator workspace lacks one.
- [x] Add regression coverage and validate that commission payout remains Admin-controlled rather than automatic.
- [x] Checkpoint the commission-visibility result and resume the role acceptance walkthrough.

## Commission panel version alignment

- [x] Identify that the user was on an earlier dynamic preview rather than the freshly restarted build where the protected commission panel was verified.
- [x] Make the tested commission-status panel available on the user-facing version without altering commission data.
- [ ] Confirm the visible panel with the user and checkpoint the corrected acceptance flow.

## Payment reconciliation role separation

- [x] Inspect current Field Moderator and Admin visibility of service-order reconciliation and commission-payout controls.
- [x] Remove payment-reconciliation controls from Field Moderator Operations while retaining its read-only verification commission status.
- [x] Ensure protected Admin governance exposes official platform-order reconciliation and commission-payout approval controls.
- [x] Add regression coverage, validate role boundaries, checkpoint the clarification, and resume acceptance testing.

## Final Admin governance acceptance check

- [x] Confirm Bryan can access protected Admin commercial settings, official service-order reconciliation, cash-flow audit, commission approval, trust reports, and role management without exposing those controls to a Field Moderator.

## Printable receipts, beginner guide, and responsive readiness

- [x] Define the protected AHC platform-service receipt data, non-custodial wording, and Admin issuance boundary.
- [x] Add a printable confirmed-service receipt view to Admin payment reconciliation without exposing tenancy-money functionality.
- [x] Create a simple-English beginner operational guide of fewer than 10 pages and verify its printable output.
- [x] Review and improve key public and protected workflows at mobile, tablet, and desktop viewports.
- [x] Add regression coverage, validate the deliverables, checkpoint the release, and provide the updated project version.

## Direct guide delivery

- [x] Remove the beginner operating-guide source and generated file from the website project, retain a standalone Word copy outside the project, and deliver it directly to the owner.

## Google discoverability check

- [x] Check current public Google discovery for the AHC domain and identify the indexability actions required for reliable visibility; the published AHC domain was not returned in the check, and the robots/sitemap paths currently fall back to the SPA page instead of serving crawl-control files.

## Share previews, property trust cues, and mobile map polish

- [x] Audit the existing public property-link route, crawler metadata response, primary-card source/freshness labels, and Leaflet mobile layout.
- [x] Serve crawler-visible OpenGraph metadata for public shared property links without exposing protected evidence or exact locations.
- [x] Make the truthful Managing Agent and listing freshness cues more prominent on primary property cards while preserving the unified Agent pathway.
- [x] Improve small-device Leaflet map height, control placement, and bottom actions for comfortable touch use.
- [x] Add regression coverage, validate crawler and responsive behavior, checkpoint the update, and provide the new project version.

## Pricing and public verification clarity review

- [x] Inspect configured AHC platform-service prices and public listing publication/verification rules, then provide an owner-facing assessment of price level and badge meaning.

## Explicit verification labels and proposed pricing model

- [x] Change public cards so non-physically-verified listings clearly say they have not yet received an on-site Field Moderator visit.
- [x] Assess the proposed 5,000 XAF verification fee, 10,000/25,000 XAF monthly plans, and 2,500 XAF seven-day featured listing price against the current model and recommend a pilot launch structure.
- [x] Add regression coverage, validate the public label, checkpoint the update, and report the completed commercial assessment.

## Unchanged-price profit model

- [x] Build a transparent monthly AHC profit model using current fees, illustrative paid-activity scenarios, direct Field Moderator payouts, payment-collection costs, and stated operating-cost assumptions before any commercial-setting change.

## Approved welcome bundle and recurring plans

- [x] Implement the approved pricing model across persisted commercial entitlements, server controls, staff settings, Agent purchase flow, fixtures, and regression coverage.
- [x] Define and expose a 3,000 XAF first-month New-Agent Welcome Bundle with five listing credits, normal Starter benefits, and no priority ranking.
- [x] Introduce second-month 10,000 XAF Starter (five credits) and 25,000 XAF Pro (priority ranking and up to 20 active listings) recurring access options.
- [x] Set featured placement to 2,500 XAF for seven days and define 5,000 XAF route-batch / 7,500 XAF individual physical verification orders with their 80/20 splits.
- [x] Update non-production commercial fixtures and Admin/Agent workflows without weakening the non-custodial payment boundary.
- [x] Add regression coverage, validate the commercial flows, checkpoint the pricing release, and document how the first-to-second-month transition works.

## Automated platform-service payment verification design

- [x] Design a provider-aware, webhook-led verification workflow for AHC platform-service payments that preserves Admin exception review, fraud controls, auditability, and the non-custodial tenancy boundary.
- [x] Recommend the first AHC payment-collection route and document its provider-onboarding, verification, and fallback gates before implementation.

## Secure production-data testing access

- [x] Design and, where safely possible, prepare a one-way least-privilege production-to-local testing data workflow without exposing live database credentials or permitting local writes to production.
- [x] Add and validate the token-protected sanitised snapshot endpoint, the separate local `ahc_local_test` schema, and the XAMPP command-line importer templates.
- [x] Bind the user’s XAMPP scripts folder, import the local schema, place the user-controlled token in the local configuration, and validate the first laptop pull.
- [ ] Repair the local XAMPP/MariaDB privilege-table inconsistency (`db` / `global_priv`) before creating the least-privilege local importer account.
- [x] Use the existing local XAMPP root login only as a documented temporary fallback for the isolated `ahc_local_test` importer until the local MariaDB privilege tables are fully rebuilt.
- [x] Identify and configure the active local XAMPP MySQL service port before validating the first sanitised snapshot pull.
- [x] Replace the mismatched snapshot token with one user-controlled value configured both in the protected AHC endpoint and the local private configuration file.
- [x] Verify and align the deployed snapshot endpoint’s token environment with the local importer after an HTTP 401 from the public domain.
- [x] Confirm and observe the protected snapshot endpoint’s retry cooldown after the first successful token validation generated an HTTP 429 response.
- [x] Correct the local importer configuration from the unavailable `ahc_local_sync` account to the documented temporary local-root fallback and confirm its isolated database access.

## Final local test package and comprehensive SRS

- [x] Create a 15–17 page Word Software Requirements Specification covering the full AHC platform, roles, trust rules, commercial workflow, and validated local snapshot testing setup.
- [x] Build and package a standalone XAMPP local test interface (`index.php`, CSS, JavaScript, and PHP data endpoint) that reads only the isolated `ahc_local_test.sanitized_listings` database.
- [x] Validate the local test package, assemble a safe downloadable archive, and deliver it with the Word SRS.

## Owner-only WhatsApp operational alerts
- [x] Define the owner-only high-priority WhatsApp alert events, recipient controls, message data-minimisation rules, and provider delivery requirements.
- [x] Implement a server-side event-alert framework with audit records and Admin controls for confirmed payments, verification outcomes, safety actions, and published announcements.
- [ ] Configure a WhatsApp delivery provider using protected credentials, test delivery, and document operational setup without exposing user or payment data.

## Account-entry and Admin lead clarity
- [x] Add accessible show/hide password controls wherever users enter an AHC password, without weakening masked-by-default behavior or autocomplete guidance.
- [x] Replace repeated Admin lead rows with one clear listing-level WhatsApp lead count that increases for every tracked click.
- [x] Add regression coverage and visual validation for password visibility and cumulative lead-count presentation.

## French discovery and Agent identity upgrade
- [x] Add a French-language interface option to public discovery and account-entry flows, without weakening existing English access.
- [x] Introduce image-first property quick views and a protected full-detail experience that shows media and total move-in cash before the itemised breakdown; require sign-in before revealing the map.
- [x] Extend Agent onboarding and profile records with taxpayer-number evidence and JPG government-ID front, back, and face-view uploads stored privately.
- [x] Restructure the Agent workspace into a standalone full-page experience with an Agent profile section.
- [x] Add migration, authorization, upload-format, multilingual, property-access, and responsive-interface regression coverage.

## Recovery note
- [x] Re-implement and validate the website changes from the stable checkpoint after experimental inherited edits were rolled back.

## August 2026 Agent identity and standalone-route hardening

- [x] Resolve the server persistence syntax/runtime regression and validate the full TypeScript build.
- [x] Add protected Agent-only JPG upload handling for government ID front, back, and face-view evidence using private storage keys.
- [x] Expose a protected identity-completion status query without returning document URLs.
- [x] Add Agent workspace profile identity status and responsive JPG upload controls.
- [x] Replace the /agent marketplace drawer route with a standalone full-page Agent workspace.
- [x] Add regression coverage for identity upload boundaries and update the strict taxpayer-number onboarding fixture.
- [x] Run the complete Vitest suite: 99 tests passing; TypeScript validation clean.
- [x] Decline a live browser upload test with real identity documents and substitute synthetic TEST-ONLY JPG fixtures.

## Safe Agent identity-upload validation
- [x] Validate the three-part Agent JPG upload using only synthetic TEST-ONLY images; never request or use real identity documents.
- [x] Confirm private storage and authorization boundaries remain intact during the synthetic upload test.

## Media-first property detail refinement
- [x] Show media and Total Move-In Cash publicly before any sign-in requirement.
- [x] Gate the itemised cost breakdown and approximate map behind the seeker sign-in completion flow.
- [x] Confirm the hash-routed Agent workspace is a separate full page with its profile section visible.
- [x] Add targeted regression coverage and validate the revised public-to-protected property flow.

## Anonymous public-home query repair
- [x] Identify and suppress the protected query issued during anonymous public-home browsing.
- [x] Preserve sign-in prompts only for explicitly protected actions, without global redirect or console-error noise.
- [x] Add regression coverage and validate an anonymous public-home session in the browser.

## Owner-only test-account credential reference
- [x] Verify the current non-production account roster and distinguish test credentials from real-user password data.
- [x] Create an owner-only Word reference covering role access, available demo credentials, and password-reset guidance.
- [x] Review and deliver the document without exposing real-user credentials.

## Complete public French translation
- [x] Audit the public marketplace, preview, sign-in prompts, and account-entry copy that currently remains English after locale switching.
- [x] Expand the locale dictionary and bind all visible public text to it.
- [x] Add locale-completeness regression coverage and validate English and French rendering in the browser.

## Reusable bilingual delivery workflow
- [x] Create and validate a reusable skill documenting the AHC full-stack marketplace and bilingual-delivery workflow.
- [x] Persist the public language selection in local storage and restore it on later visits.
- [x] Translate the standalone Agent dashboard and profile experience with the same shared locale system.
- [x] Add reduced-motion-safe language-switch transitions, Agent access-status localization, and regression coverage for persistence and Agent locale support.

## Language menu refinement
- [x] Replace each English/French toggle with an accessible language-selection dropdown while preserving persisted shared locale behavior.
- [x] Add regression coverage and validate the menu at desktop and mobile widths.

## Payment and WhatsApp provider continuation
- [x] Audit the current payment-reference, reconciliation, receipt, and provider-readiness workflow to define the next production payment increment.
- [x] Review the existing Meta WhatsApp Cloud API alert foundation, credential status, and webhook safeguards before continuing provider activation.
- [x] Implement the selected safe payment and WhatsApp provider improvements with automated regression coverage.
- [x] Validate the completed provider-ready flows and document the owner activation steps required for live delivery.

## Dual Mobile Money provider readiness
- [x] Define one secure provider contract for both MTN MoMo and Orange Money without accepting rent, deposits, or tenancy funds through AHC.
- [x] Add provider-specific payment-order metadata and validation while preserving Admin reconciliation and post-confirmation receipts.
- [x] Add dual-provider regression coverage for reference handling, duplicate prevention, reconciliation, and receipt boundaries.
- [ ] Prepare secure activation inputs for MTN MoMo, Orange Money, and Meta WhatsApp Cloud API.

## Dual-provider payment experience
- [x] Make the Agent payment journey explicitly provider-specific for MTN MoMo and Orange Money, including clear payment-reference guidance and pending-confirmation status.
- [x] Make the Admin reconciliation view show the selected Mobile Money provider and protect receipt generation until a valid confirmation decision.
- [x] Add focused UI and workflow tests for the dual-provider payment experience and validate the signed-out workspace presentation.

## Merchant onboarding prerequisite
- [ ] Complete MTN MoMo and Orange Money business/merchant onboarding before supplying protected credentials for live collection and provider callbacks.
