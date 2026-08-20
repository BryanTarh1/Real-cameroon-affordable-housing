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
- [x] Create an owner-run guide that separates AHC’s provider-independent payment controls from MTN and Orange merchant onboarding.
- [ ] Complete MTN MoMo and Orange Money business/merchant onboarding before supplying protected credentials for live collection and provider callbacks.

## Shortlist, viewings, and Moderator routes
- [x] Add a seeker-owned saved shortlist with a privacy-safe side-by-side property comparison limited to public and seeker-authorized details.
- [x] Add agent-managed viewing slots with explicit seeker request, agent confirmation/decline, cancellation, and stale-slot safeguards.
- [x] Add a Moderator-only route planner that groups eligible verification work by approximate public landmark zones without exposing exact compounds.
- [x] Add schema migrations, protected tRPC procedures, focused Vitest coverage, and responsive visual validation for all three workflows.

## Ten-feature marketplace enhancement programme
- [x] Reconcile the original ten proposed marketplace improvements against the preserved project history and confirm the four items not named in the current feature summary before implementation.
- [x] Add a signed-in seeker budget-fit calculator that clearly distinguishes illustrative affordability guidance from lending, financial, or tenancy approval.
- [x] Add a 48-hour viewing-request availability-reconfirmation safeguard with privacy-safe state transitions and accountable Agent action.
- [x] Add immutable, seeker-visible price-history and material-change disclosures that do not expose private internal audit evidence.
- [x] Add a server-side duplicate-listing risk detector and protected staff review workflow without automatic punitive action on uncertain matches.
- [x] Add a structured post-viewing outcome flow for authenticated seekers without public ratings, testimonials, or fabricated reviews.
- [x] Add an Agent quality dashboard based only on verifiable platform events, with no fabricated ratings, reviews, or response claims.
- [x] Add a low-data marketplace mode that preserves core price, freshness, and safety information on constrained mobile connections.
- [x] Add migrations, role-authorized procedures, focused Vitest coverage, and responsive validation across all seven remaining features.
- [x] Publish this checkpoint and activate the project-level 48-hour viewing-availability expiry schedule against the deployed site.

## Seven-feature live testing walkthrough
- [x] Create a concise role-based guide that walks the owner through testing each newly released marketplace feature on the live site.

## Pre-payment stability stress validation
- [x] Audit existing regression coverage and define safe, deterministic high-volume scenarios for public discovery, protected workflows, role boundaries, and appointment state transitions.
- [x] Add scale-oriented regression coverage that does not insert, alter, or disclose live customer data.
- [x] Run comprehensive TypeScript, unit, integration, authorization, database, and controlled concurrency validation; investigate every reproducible failure.
- [x] Review desktop/mobile routes and current runtime logs for interface or server regressions.
- [x] Fix verified defects, add regression protection, rerun validation, and save a final stable checkpoint before any payment expansion.

## Customer dashboard and payment-experience feedback
- [x] Add a protected customer dashboard route with a clear account overview and safe navigation back to the marketplace.
- [x] Add customer-owned profile viewing and editing without exposing protected Agent, Moderator, or Admin identity data.
- [x] Add customer-owned platform-service order tracking with status, provider, amount, and receipt access only for that customer’s records.
- [x] Add accessible pending, success, and actionable error feedback to existing and upcoming platform-service payment actions without collecting rent, deposits, or other tenancy funds.
- [x] Add role-authorized procedures, focused Vitest coverage, and responsive UI validation for dashboard and payment-experience workflows.
- [x] Correct the authenticated dashboard-load error state so a service failure is never misrepresented as a sign-in requirement.

## Customer dashboard personalisation and checkout feedback
- [x] Add customer-owned favourite listings and a private recent-browsing history with protected listing references.
- [x] Add a safe customer profile-picture upload that accepts only small image files, stores only an object reference, and never exposes another account’s image-management controls.
- [x] Add customer-managed email-notification preferences without sending or implying real email delivery until an email provider is separately configured.
- [x] Add a clearly labelled test-only checkout simulator that exercises loading, success, retry, and error feedback without charging any payment method or creating a real platform-service order.
- [x] Add schema migration, ownership tests, storage validation, and desktop/mobile regression coverage for the new dashboard extensions. TypeScript and 146 tests pass; signed-out desktop and mobile dashboard captures confirm the protected route’s responsive access boundary.

## Global protected-route hardening
- [x] Prevent direct hash-path changes from rendering any unauthorized Agent, Moderator, Admin, or customer workspace content; enforce role-appropriate redirects while retaining server-side authorization as the security boundary.
- [x] Add route-access regression coverage for signed-out and wrong-role deep links, validate the protected-route layouts, and publish the safe workspace links. Desktop and mobile visual checks: anonymous deep links to Admin, Operations, route batches, Agent, customer dashboard, and acceptance each returned to the public marketplace without rendering a protected workspace. Full suite: 148 tests pass; production build succeeds.

## Standard browser URL migration
- [x] Replace hash-based AHC navigation with standard browser paths, preserve legacy hash links through safe migration redirects, and retain protected-route role enforcement on direct visits and refreshes.
- [x] Update route, navigation, deep-link, and responsive regression coverage; validate standard URLs at desktop and mobile sizes; checkpoint and deliver the normal-looking production links. TypeScript, 150 tests, and production build pass; desktop/mobile checks confirm normal direct paths and former hash links safely land at permitted pages without rendering protected content.

## Clean-link authorization security review
- [x] Conduct a controlled, non-destructive audit of anonymous, cross-role, legacy-link, direct-request, and object-ownership authorization boundaries for the new browser-path routes.
- [x] Remediate any verified authorization bypasses, add regression coverage, validate the fixes, and checkpoint the security review. The audit found and closed a private-storage proxy bypass, and it added server-side Agent API role enforcement. Anonymous clean-path checks redirect safely; TypeScript, 157 tests, and the production build pass.

## Profile-picture removal
- [x] Allow a customer to remove their profile picture and restore a blank/default avatar state without affecting another account.
- [x] Add ownership and UI regression coverage for avatar removal, then validate and checkpoint the change. Focused and full validation pass: 160 tests and the production build succeed. Signed-out desktop/mobile dashboard checks preserve the protected-route redirect; authenticated blank-avatar behavior is covered by dashboard UI and ownership regressions.

## Trust-first marketplace upgrade
- [x] Preserve clearly labelled test listings until real listing status, evidence, freshness, and moderation workflows are live-tested. Current fixture inventory keeps the stored TEST DATA title prefix, shows a protected-detail disclosure, and has focused regression plus desktop/mobile verification.
- [x] Improve the protected property-details experience with complete, data-backed listing information and a clear viewing-request action.
- [x] Add reliable discovery filters for property type, bedrooms, furnished status, monthly rent, Total Move-In Cash, availability, verified status, and neighbourhood.
- [x] Strengthen report reasons and moderation review without automatic punishment based solely on report volume.
- [x] Standardise the viewing-request lifecycle around Requested, Agent responded, Viewing scheduled, Viewing completed, and Cancelled, with safe meeting and reminder information.
- [x] Consolidate renter dashboard tools, add objective agent trust signals, and introduce stored saved-search alerts without implying unconfigured email or WhatsApp delivery.
- [x] Add ownership, authorization, desktop/mobile, and regression validation for the marketplace upgrade, then checkpoint it. Desktop and mobile verification: expanded public discovery filters render correctly, and anonymous access to `/dashboard` safely returns to public content. Authenticated renter-dashboard behavior is covered by UI and ownership regressions. Full TypeScript/build validation and 163 tests pass.

- [x] Add a persisted furnished-status field and reliable public discovery filter so the trust-first discovery checklist is complete without inferring listing details.

## Media-first public discovery refinement
- [x] Make verified walkthrough videos and listing imagery the dominant public browsing surface while retaining a continuously prominent Total Move-In Cash figure.
- [x] Add responsive and regression validation for the media-first listing experience, then checkpoint the refinement. Full suite: 165 tests pass; production build and desktop/mobile visual reviews pass.

## Developer-tools reference guide
- [x] Create a Word guide that classifies the developer and operational tools shared by the owner, explains safe step-by-step use, and prioritises their relevance to Affordable Housing Cameroon.

## Independent continuation handover
- [x] Document how the owner can continue developing, hosting, securing, and operating AHC outside Manus, including the required replacements for managed services and scheduled jobs.

## Search-result loading state
- [x] Add an accessible, responsive, reduced-motion-safe loading skeleton for public property search results and verify it through regression and responsive review. Full suite: 168 tests pass; production build and desktop/mobile visual reviews pass.

## Agent and Moderator access repair
- [x] Diagnose why the reported browser cannot sign in to Agent and Field Moderator workspaces, distinguishing credentials, provisioning, route guards, and session/runtime errors. Cause confirmed: the global protected-route guard redirected signed-out visitors before the existing role-specific AHC sign-in forms could render.
- [x] Repair any verified access defect, add focused regression coverage, validate both role entry paths, and checkpoint the fix. Anonymous Agent, Field Moderator, Field Moderator route-board, and Admin paths now expose only their secure sign-in boundary; wrong-role protection and server-side authorization remain enforced. Full suite: 170 tests pass; production build and desktop/mobile checks pass.

## Property sharing, neighbourhood privacy, and card trust signals
- [x] Add crawler-visible, property-specific OpenGraph sharing metadata with an approved generated share card, landmark location, and Total Move-In Cash, without exposing private information. The server metadata includes only persisted property type, physical-verification state, declared supply capacity, approximate landmark, and price; it does not publish the compound door, contacts, proof, or an exact address.
- [x] Verify and enforce 200–500 m landmark-radius map pinning so exact compound locations remain private until a viewing is scheduled. The shared helper clamps the stored radius and moves the public point away from the submitted reference; the public map now labels the same bilingual radius boundary and displays the persisted privacy radius.
- [x] Strengthen the public listing-card presentation of objective ownership type and freshness information, with focused regression, desktop/mobile, and crawler-metadata validation. Cards now render the persisted direct-owner or managing-agent declaration and an emphasized reconfirmation signal; 176 tests, a production build, desktop/mobile review, and a WhatsApp-style live crawler response check pass.

## Seeker acquisition, ethical demand metrics, and privacy guidance
- [x] Produce an in-depth owner guide for increasing voluntary seeker sign-ups, translating aggregate demand signals into ethical platform revenue, and applying privacy-by-design safeguards to seeker accounts. The guide includes voluntary activation prompts, a decision-ready funnel, minimum-cohort aggregate demand reporting, ethical supply-side revenue models, a 90-day operating plan, and Cameroon Law No. 2024/017 research with a local-counsel review recommendation.

## Marketplace workflow feasibility review
- [x] Audit the existing Zillow-inspired Total Move-In Cash, Leaflet landmark-map, and cost-breakdown presentation; implement only any verified usability gap. The total and protected breakdown were already truthful; each approximate landmark pin now has a compact public Total Move-In Cash label without adding any door-level location data.
- [x] Audit the existing Field Moderator evidence, verification, and freshness lifecycle; implement only any verified data-backed verification-status gap without exposing proof publicly. Private proof, two-photo and walk-through requirements were already present; public physical badges now resolve to unverified when the saved verification period has expired.
- [x] Assess the requested three-report automatic safety hold against AHC’s human-review and anti-abuse requirements; implement a safe evidence queue alternative only if a real gap exists. Three distinct cost or availability reports now create a private priority-review signal with account-age and network-pattern context; report volume alone cannot suspend a listing, erase a badge, or restrict an Agent.
- [x] Audit the tracked WhatsApp lead flow and Admin lead measurement; implement only any verified authorization, tracking, or user-experience gap. The existing protected hand-off logs an authenticated lead before producing the pre-filled WhatsApp link, and only Admins can read lead counts; focused authorization and count regressions pass.

## Safety-report review status notifications
- [x] Add a protected, reporter-owned in-app status update after an Admin completes a safety-report review, revealing only the report’s own reviewed state and a privacy-safe outcome message. Admin completion is auditable and creates one owner-scoped update; the dashboard notices disclose no staff notes, proof, other reports, sanctions, or enforcement rationale.
- [x] Add ownership, role, and information-disclosure regressions; validate the reporter account experience at desktop and mobile sizes. The release adds protected reviewer and reader tests, full test/build validation, and desktop/mobile checks of the anonymous account-route boundary.
- [x] Repair the discovered `/account` protected-dashboard route regression so reporter-owned review updates remain reachable through the documented clean URL. `/account` now uses the same role-aware CustomerDashboard guard as `/dashboard`, and anonymous visitors safely return to the marketplace instead of receiving a 404.

## Complete bilingual interface coverage
- [x] Audit every public and protected page for English-only interface strings, including form labels, placeholders, help text, options, inline validation, loading states, error messages, toasts, empty states, and action controls. The audit found that page-specific dictionaries alone did not cover all legacy and staff forms.
- [x] Extend the shared locale architecture and translate all verified gaps into French while preserving values, identifiers, role boundaries, and non-translatable user content. A global AHC static-interface layer now changes only known AHC text and approved accessibility attributes, keeps an explicit no-translate boundary, and synchronises the language across routes; public Agent, Moderator, and Admin sign-in forms also receive the selected language directly.
- [x] Add locale-completeness and form-state regressions, then validate English/French desktop and mobile views across public, Agent, Moderator, Admin, and seeker account entry points. Added translator, staff-access, and Agent-form regressions; 197 tests, production build, and French desktop/mobile visual review passed.

## Public Manus reference cleanup
- [x] Audit visitor-visible pages, metadata, icons, and bundled public assets for mentions of Manus AI or Manus branding; preserve non-visible runtime configuration and the existing domain. No visitor-facing reference was present in the public client source, server-rendered preview output, document metadata, or homepage visual review.
- [x] Remove confirmed public-facing references and add regression coverage so future visitor copy does not reintroduce them. No public-facing reference required removal; runtime environment names and the existing domain remain untouched because they are not website copy or visible branding.

## Analytics geography investigation
- [x] Inspect the configured analytics script and available site traffic records to explain United States-labelled pageviews without treating location data as proof of genuine United States visitors. The repository confirms a proxy-hosted analytics integration but contains no raw event-level data; official provider documentation confirms that country is IP/proxy-derived and that recognised-bot filtering is not a proof that every automated request is absent. The resulting guidance is recorded in `docs/analytics-geography-investigation.md`.

## Login and safety-report CAPTCHA
- [x] Audit the current local sign-in and authenticated safety-report submission contracts, then select a privacy-conscious CAPTCHA provider with server-side verification. Cloudflare Turnstile was selected; the configured server secret was independently validated against Siteverify without exposing it in client code.
- [x] Add required CAPTCHA completion and server verification to each sign-in and safety-report submission path without exposing provider secrets or allowing client-only bypass. Local registration and password sign-in share an accessible Turnstile widget; authenticated safety reports require an independent token; the server fails closed when the secret is absent or validation fails.
- [x] Add disabled-provider, failed-token, expired-token, route-coverage, and protected-flow regressions; document the one-time provider credential activation step. The full suite passes with 204 tests and the production build succeeds; the provider documentation records hostname management and the preview-only `110200` recovery path.

## Production safeguards verification
- [x] Verify whether server-side move-in-cost validation, landmark-radius privacy, tracked WhatsApp lead logging, and 14-day freshness automation already meet the requested production refinements; identify only concrete gaps. Move-in totals are derived server-side from validated component values rather than accepted as an agent-provided total; public maps use one generated 200–500 m landmark point with no exact-coordinate columns; authenticated WhatsApp lead events are persisted before the 302 redirect; and an enabled daily 03:00 UTC cron archives stale published listings after 14 days. The remaining product decision is whether expiry should additionally set a physical-verification badge to unverified instead of relying on the existing archived/non-public state.

## Verified-listing preview media
- [x] Inventory the current physically verified listing media, then improve preview attention with media that is clearly distinguished from real field evidence and required moderator walk-through footage. Four published test listings are physically verified; two have published 16-second walkthroughs and the other two have no published video.
- [x] Add provenance labels and regression coverage so generated illustrative assets cannot receive a physical-verification or real-walk-through claim. The public interface now explicitly states that AHC does not substitute generated footage when a field walkthrough is unavailable, with focused regression coverage for the no-manufactured-video boundary.
- [x] Make existing moderator-captured photos and published vertical walkthroughs the primary card preview for physically verified listings; display an explicit real-evidence-only unavailable state where a verified listing has no published walkthrough. The media rail now includes existing videos and transparent unavailable cards for verified listings missing a public walkthrough; desktop/mobile checks, 205 Vitest tests, and a production build pass.
- [x] Repair public photo rendering for verified listings using only the existing genuine public photo URLs, and ensure no synthetic image or video substitute appears when authentic media is unavailable. Approved gallery photos now render as primary media where a verified listing lacks a published moderator walkthrough, and the listing detail presents the complete approved-photo set.
- [x] Create a curated public gallery model and authorize only the owner-approved, non-document private evidence from the four existing physical-verification TEST DATA records for public display with preserved test-data provenance. Eight approved photo records now have separate, auditable public-gallery entries; raw private evidence and documents remain outside public projections.
- [x] Enforce that a listing can become publicly published only after a passed physical confirmation and at least one expressly approved public photo or published moderator-captured walkthrough; cover publication, depublication, and private-evidence non-disclosure with regressions. Public discovery filters out any listing without current physical verification and approved media. The full suite passes with 208 Vitest tests and the production build succeeds.

## Admin role wording
- [x] Replace the Admin-board audience label “Seeker / Agent” with “Seeker or Agent” without changing underlying role values or authorization behavior. The selector still submits the same internal `user`, `moderator`, and `admin` values; a production build passes.
- [x] Replace the combined `user` role with distinct `seeker` and `agent` roles through a safe migration; update Admin role assignment, preserve Moderator/Admin protections, and add authorization regressions for each role. Existing accounts were mapped according to Agent-profile ownership, public registration permits only Seeker or Agent, and the Admin selector now offers Seeker, Agent, Moderator, and Admin independently. All 211 Vitest tests and the production build pass.

## Homepage copy refinement
- [x] Shorten and simplify the homepage’s high-visibility public copy while retaining required trust, privacy, pricing, freshness, and verification information in English and French. Focused bilingual disclosure regression, 213-test suite, production build, and English/French desktop plus mobile review pass.

## Budget-fit feature discoverability
- [x] Verified that the budget-fit calculator appears for signed-in seekers directly above the public Fresh Homes controls; it deliberately remains hidden until sign-in because it evaluates the seeker’s entered income and available move-in savings. No rendering or access defect was found.

## Owner WhatsApp event notifications
- [ ] Audit the existing event-alert and WhatsApp provider implementation, then define and implement privacy-safe owner alerts for approved major platform events.
- [x] Add privacy-minimised owner alerts for successful Agent, Moderator, and Admin sign-ins only; preserve the exclusion of individual Seeker sign-in alerts. The event is queued only after successful authentication and carries a non-sensitive role/reference label.

## Registration confirmation reliability
- [ ] Diagnose and repair the reported registration confirmation failure while retaining fail-closed Turnstile verification and duplicate-account protection.

## Owner email notification fallback
- [x] Add a privacy-safe email fallback for approved owner alerts while Meta WhatsApp activation is unavailable. Resend is used only when Meta WhatsApp has not completed signed delivery-webhook activation.
- [x] Implement the approved transactional-email sender, owner recipient configuration, delivery audit state, and non-blocking failure handling for owner alerts. Resend credentials and sender validation pass; a controlled email activation alert was accepted by the provider.
- [x] Isolate the live Resend credential probe from ordinary offline regressions while retaining a repeatable explicit provider-validation command. `pnpm test:resend:live` verifies configured live credentials; normal tests stay offline and deterministic.

## Pilot and launch-readiness assessment
- [x] Assess the current marketplace against pilot-launch requirements and prioritise only the next additions that materially improve safety, trust, usability, or operations. Recommendation delivered separately; no unselected feature work was committed.

## Independent project handover
- [x] Prepare a beginner-safe guide for exporting the project, backing up its data and media, recreating dependencies, and running it independently outside the current platform. The guide identifies the current storage dependency that must be replaced before independent public hosting.

## Universal public verification disclosure
- [x] Remove the redundant “Physical badges only” public control and replace it with a bilingual statement that every public home has current Field Moderator verification and approved real media. Focused regression, 218-test suite, production build, and desktop/mobile review pass.

## Language control clarity
- [x] Remove the duplicate public language control while retaining a single accessible English/French selector and full-page translation behaviour. Focused regression, 218-test suite, production build, and desktop/mobile review pass.

## Completed-project recap
- [x] Prepare a structured owner recap that distinguishes implemented platform capabilities from remaining external activation steps. Delivered as a standalone owner-facing reference document.

## Reusable advanced framework assessment
- [x] Explain how an advanced reusable local framework is used and assess whether the current marketplace should be converted into one before implementation begins. Delivered as a standalone guide; no framework code was created yet.

## Advanced reusable framework

- [x] Create a separate sanitised framework repository structure that excludes AHC production data, secrets, branding, live domains, and housing-specific rules.
- [x] Extract reusable role-based access, moderation, media-governance, owner-alert, bilingual-interface, audit, configuration, and test foundations.
- [x] Provide a documented template/example plus a repeatable new-project workflow and a packaged local-framework archive.

## Competitor-informed AHC enhancement planning

- [x] Prioritise and confirm a competitor-informed enhancement package that emphasises AHC’s current-verification, total move-in cash, media-governance, safety, and location-privacy strengths before implementation.
- [x] Refocus the next AHC package on real local adoption, trusted early supply, and a controlled pilot because the reviewed competing platforms appear to have limited practical use in the target market.

## Adoption-led Trust Passport and pilot tools

- [x] Add a public Trust Passport that presents approved evidence boundaries, physical-review recency/expiry, approved media status, and transparent total move-in cash without exposing private evidence or exact locations.
- [x] Add a guarded Safe Viewing Request workflow with privacy-safe scheduling, authorised status handling, and no premature exposure of exact property coordinates.
- [x] Add an Agent launch/onboarding progress experience that explains the required steps for an eligible public listing without weakening existing role, identity, or media requirements.
- [x] Add an owner/Admin pilot dashboard showing genuine operational counts for eligible homes, review freshness, agent submissions, safe-viewing requests, and safety reports.
- [x] Add focused automated tests plus desktop/mobile validation for the new trust, viewing, onboarding, dashboard, authorization, and privacy flows.

## Sign-in feedback and duplicate-submission prevention

- [x] Improve all AHC-supported credential sign-in forms with accessible processing feedback, disabled repeat submission, clear wrong-credential/recoverable-error guidance, and focused automated coverage.

## Seeker safe-viewing status journey

- [x] Confirm the existing privacy-safe Seeker appointment history already presents each user’s own viewing-request statuses, next steps, authorised appointment details, cancellation, and private post-viewing outcomes without premature exact-location disclosure.
- [x] Confirm the existing authenticated Seeker appointment flow enforces ownership and privacy boundaries through its established router procedures and public marketplace rendering.

## Owner pilot readiness checklist

- [x] Add an Admin-only Pilot Readiness Checklist that converts genuine pilot-summary counts into clear operational next steps without inventing launch metrics or exposing private records.
- [x] Add focused authorization, guidance-state, and responsive-flow validation for the owner Pilot Readiness Checklist.

## Owner weekly pilot activity

- [x] Add an Admin-only seven-day pilot activity summary using only genuine timestamped listing, viewing, and safety-report records without exposing people, contact details, addresses, or private evidence.
- [x] Add focused Admin-authorization, time-window, and responsive presentation validation for the weekly pilot activity summary.

## Viewing follow-through improvement

- [ ] Audit and improve the privacy-safe transition from a Seeker viewing request to a confirmed, cancelled, or completed appointment without exposing exact locations prematurely.
- [ ] Add focused ownership, status-transition, and responsive-flow validation for the approved viewing follow-through improvement.

## Media-first discovery and listing quality

- [x] Enforce a clear public-listing quality standard requiring a substantive description and at least five approved public images before publication, while preserving an approved public walkthrough as a valid alternative and retaining private-evidence boundaries. Existing approved gallery evidence remains separately curated; no private verification material is projected publicly.
- [x] Add clear public property facts for bedrooms, bathrooms, parking, and neighbourhood amenities through an additive schema migration, safe public projection, Agent entry form, and listing-detail support. The description and declared facts are labelled as Agent-declared, while field-captured area observations retain their Field Moderator provenance.
- [x] Refine the public discovery layout so media appears first, total move-in cash follows immediately beneath it, and the search entry is compact with optional filters revealed only on request.
- [x] Add privacy-safe relevant-property suggestions based only on the current public listing/search context. Ranking considers city, property type, bedroom count, displayed rent band, and optional area wording; it never reads saved items, viewer history, contacts, private evidence, or exact coordinates.
- [x] Add focused tests and responsive validation for listing quality, property facts, compact search, media-first hierarchy, and relevant-property suggestions. Full regression and build validation pass with 232 tests, 1 intentional live-provider skip, plus desktop and mobile marketplace review.

## Public inventory correction after media-quality rollout

- [x] Audit and correct the unexpectedly low visible public-home count without relaxing the verified-media standard. The compact search no longer defaults to a 300,000 XAF ceiling, so it now presents both currently eligible walkthrough-backed TEST DATA homes; the default remains adjustable by the viewer.
- [x] Verify visible inventory count, recommendation availability, regression safeguards, and responsive marketplace presentation. The full suite passes with 233 tests and one intentional live-provider skip; the production build and desktop marketplace review confirm both eligible homes are visible.
- [ ] Add new owner-authorized, genuine Field Moderator-captured photos or published walkthroughs for the remaining clearly labelled TEST DATA listings before they can return to public discovery. Existing evidence supplies only two or three distinct non-document photos per excluded listing; it must not be duplicated, invented, or represented as verified property media.
- [ ] Receive and match owner-authorized genuine property-photo sets to each excluded TEST DATA listing, then curate only suitable non-document media through the existing Field Moderator approval boundary.

## Labelled illustrative TEST DATA catalogue restoration

- [x] Create a distinct five-image, clearly labelled illustrative TEST DATA gallery for the physically verified Bonamoussadi demo listing. The gallery is explicitly marked illustrative and makes no claim that it is genuine, owner-authorized, or Field Moderator-captured.
- [x] Keep the illustrative test-media path isolated from real listing publication: it uses a separate table and explicit `illustrative_test_data` provenance. Both real and test listing discovery still requires a substantive description plus five displayed photos or a published walkthrough; real homes additionally require genuine approved media or an approved walkthrough at publication.
- [x] Validate that the restored demo catalogue visibly labels illustrative test media, retains privacy boundaries, restores the catalogue from two to three homes, and preserves existing publication-gate tests. Full validation passes with 234 tests, one intentional live-provider skip, production build, and desktop/mobile review.
- [ ] Complete the Makepe illustrative TEST DATA gallery with one additional distinct image once image generation is available again. The daily free-plan image quota is currently exhausted; Makepe has two approved evidence photos plus two labelled illustrative test images, so remains correctly hidden under the five-photo rule.

## Refreshed AHC presentation and in-depth SRS

- [x] Consolidate the current AHC product scope, user roles, workflows, trust safeguards, technical architecture, integrations, data model, test posture, and deployment boundaries from the implemented project.
- [x] Create a refreshed 11-slide PowerPoint presentation covering the product, marketplace advantage, media-first discovery, operational model, architecture, security, and next steps.
- [x] Produce an in-depth Word Software Requirements Specification with functional and non-functional requirements, data entities, role permissions, interfaces, workflows, acceptance criteria, risks, and release prerequisites.
- [x] Review both deliverables for accuracy and readability, then deliver the PowerPoint and Word document as downloadable files.
