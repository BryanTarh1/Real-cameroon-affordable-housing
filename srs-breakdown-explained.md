# Affordable Housing Cameroon SRS — Breakdown and Explanation

## 1. What an SRS is

A **Software Requirements Specification**, or SRS, is the document that explains what a system must do, who will use it, what rules it must follow, what data it needs, and how success will be tested.

An SRS is not the same as a business plan, a visual design, or source code. It is a shared agreement between the founder, users, designers, engineers, moderators, and future funders. It reduces ambiguity before money is spent.

For Affordable Housing Cameroon, the SRS has been deliberately designed around the current reality: **zero capital today and a possible 100,000 XAF later**. That changes the first requirement. The immediate requirement is not “build a large application.” It is “validate the housing problem and the operating process without spending money.”

## 2. The main decision in this SRS

The SRS separates the project into two stages.

| Stage | What it means | Why it exists |
|---|---|---|
| Stage A: Manual validation service | Use free communication and data tools to manually collect seekers, listings, verification notes, and outcomes | Prove that demand exists and that credible supply can be maintained |
| Stage B: Lean software MVP | Convert the validated manual process into a responsive web app and moderation console | Reduce manual work and make the service repeatable |

This separation prevents a common startup mistake: spending limited funds on software before confirming that people will use the service and that listings can be kept accurate.

## 3. Section-by-section explanation

### 3.1 Executive decision

This section gives the project direction in one page. It states that the first product is a manual service and that the future app should help people discover potentially real homes, understand total entry cost, and request safer contact.

The wording “potentially real” is intentional. The platform must not claim that every listing is legally certified or guaranteed safe unless it has actually performed those checks. This protects users and prevents the product from making claims that its operating model cannot support.

### 3.2 Problem statement

The problem statement describes the user pain that the system must solve: incomplete pricing, stale listings, unclear fees, poor directions, unresponsive contacts, and fraud risk.

It also defines the product’s interpretation of affordability. Affordability is not only monthly rent. It may include advance payment, deposits, agency fees, utility charges, transport, and household fit. This is why the SRS requires those costs to be stored and displayed separately.

### 3.3 Objectives and success criteria

The objectives explain the desired product behavior. The success criteria explain when the founder has enough evidence to move forward.

The most important pre-development gates are:

| Gate | Practical meaning |
|---|---|
| Demand | A clearly defined group of people repeatedly describes the same urgent housing problem |
| Supply | Owners or agents are willing to provide and reconfirm listings |
| Usability | Seekers understand the difference between monthly rent and total entry cost |
| Trust | Users understand what has been checked and what remains uncertain |
| Operations | The founder can update, verify, correct, and remove listings consistently |
| Value | People request more options, refer others, or return for further help |

These gates are more important than downloads, page views, or social-media followers. They test whether the business can deliver a useful housing journey.

### 3.4 Scope

Scope defines what the product includes and excludes. This is especially important when capital is limited.

The manual validation phase includes seeker intake, listing intake, verification records, manual matching, safety warnings, and outcome tracking. The future MVP includes public search, cost transparency, listing pages, contact requests, reporting, moderation, analytics, and bilingual readiness.

The SRS defers payments, national coverage, AI recommendations, native apps, automated fraud scoring, and public phone-number directories. These are not necessarily bad ideas. They are postponed because they add cost, risk, or complexity before the core housing journey is proven.

### 3.5 Stakeholders and roles

This section explains who interacts with the system and what each person needs.

The **seeker** searches and requests contact. The **owner or agent** submits and updates supply. The **moderator** reviews listings and handles reports. The **founder or operator** monitors performance and resolves escalations. A **partner** may provide referrals or legitimate supply.

Separating these roles is important because permissions must differ. A seeker should not be able to publish an unreviewed listing. An owner should not access moderation tools. A moderator should have tools to investigate without unrestricted access to every private data field.

## 4. Stage A: what happens before software

The manual validation service is the most important part of the SRS for the current financial situation.

The founder should collect a seeker’s city or neighborhood, maximum monthly rent, maximum upfront amount, housing type, move-in timing, household size, and contact preference. Separately, the founder should collect listing location, landmark, rent, advance, deposit, fees, utilities, availability date, photos, and permission to share.

Each listing should receive a simple status such as:

| Status | Meaning |
|---|---|
| Draft | Information is incomplete or has not yet been reviewed |
| Under review | The operator is checking the information |
| Published | The listing is sufficiently complete for controlled sharing |
| Needs reconfirmation | The freshness window has passed |
| Suspended | A concern or report requires investigation |
| Archived | The listing is no longer presented as active |

The founder should track what happens after matching: whether the seeker contacted the owner, received a response, visited, discovered inaccurate information, or requested more help.

## 5. Functional requirements explained

Functional requirements describe what the system must do.

### 5.1 Authentication and roles

The public should be able to browse without creating an account. This reduces friction. Accounts may be required later for saved listings, contact history, or owner management.

The system must distinguish users by role and protect moderator tools. This is a security requirement as well as a product requirement.

### 5.2 Search and discovery

Search must support Cameroon-specific ways of describing a place. A person may know a neighborhood, landmark, market, school, major road, or informal local description rather than a formal street address.

The list view is mandatory because it must remain useful when a map is unavailable, inaccurate, expensive to load, or not understood by the user. Maps are optional support, not the only discovery mechanism.

### 5.3 Cost transparency

This is one of the most important requirements in the entire SRS.

The system must show monthly rent separately from advance, deposit, agency fee, service fee, utilities, and other charges. It must calculate an estimated entry cost only from known values. Missing costs must be shown as “Not provided,” not treated as zero.

This prevents a listing from appearing affordable simply because important charges were omitted.

### 5.4 Listing submission

Owners and agents need a guided form that encourages complete information. However, submitting a listing does not mean it becomes public immediately. Every listing must enter moderation before publication.

The system should also allow the supply side to confirm availability or withdraw the listing. If no one reconfirms a listing within the configured freshness window, its visibility should be reduced or it should be archived.

### 5.5 Contact and visits

The platform should allow a seeker to request contact without publicly exposing an unrestricted phone-number directory. The contact request needs a status so the operator can understand whether the supply side responded and whether a visit took place.

The safety warning is part of the functional flow. It should appear before a user is encouraged to send money or attend a visit.

### 5.6 Trust and moderation

Moderation is not an optional administrative feature. It is part of the product’s value proposition.

The system must support new-listing review, freshness checks, reports, status changes, verification records, and audit history. A moderator should be able to publish, request changes, suspend, archive, and restore listings.

### 5.7 Analytics

Analytics should measure the housing journey rather than vanity metrics. Important events include searches, listing views, contact requests, responses, visits, reports, and outcomes.

The system should collect only what is needed to improve the service. Analytics must not become an excuse to collect unnecessary personal information.

## 6. Non-functional requirements explained

Non-functional requirements describe how well the system must operate.

### Accessibility and usability

The product must use readable text, sufficient color contrast, visible focus states, clear labels, and understandable error messages. It should be usable in English first and prepared for French localization.

### Performance and connectivity

The product must work on low-end devices and slow mobile networks. Images must be compressed, and the core listing experience must remain useful if maps or optional images fail.

### Security and privacy

The system must protect private contact information, validate inputs, limit abuse, keep audit logs, and use secure transport. Data collection should be minimized and reviewed against Cameroon’s personal-data protection requirements before public launch [3].

### Reliability and maintainability

The system needs backups, monitoring, documented deployment, staging, and rollback. The code should separate search, cost calculation, listing state, moderation, and contact flows so that each can be tested independently.

## 7. Data requirements explained

The data section defines what the system must remember.

The core entities are users, listings, costs, media, verification records, contact requests, reports, and audit events. Separating these entities prevents the listing record from becoming an unstructured block of text.

For example, the cost entity allows the system to distinguish rent from deposit. The verification entity allows the system to display who checked the listing and when. The audit event allows the operator to understand what changed and who changed it.

## 8. Trust model explained

The SRS uses several verification levels instead of one vague badge.

| Level | What the platform is saying |
|---|---|
| Contact confirmed | The submitted contact channel was reached |
| Details reviewed | Required price, location, and availability fields were checked |
| Recently reconfirmed | The responsible contact recently confirmed the listing is still active |
| Field-checked | A defined local check was completed; this does not automatically mean title ownership was certified |

The language of each level must be visible to users. A badge is only useful when the user understands its limits.

## 9. Diagram types used in this SRS

The SRS uses **four diagram types**, each answering a different question. These diagrams are written in Mermaid so they can be rendered into images or maintained as editable source.

### 9.1 System context diagram — flowchart

**Diagram type:** System context diagram represented as a flowchart.

**Question it answers:** Who or what interacts with the system, and what major services sit around it?

The diagram shows seekers, owners or agents, moderators, the web/PWA client, application API, catalogue database, image storage, notification services, optional map services, and analytics or audit logs.

It is useful at the beginning of design because it establishes the system boundary. It prevents the team from confusing the product with external services such as SMS, maps, or storage.

### 9.2 Seeker workflow diagram — activity flowchart

**Diagram type:** User workflow or activity flowchart.

**Question it answers:** What steps does a seeker take from opening the service to reporting an outcome?

The flow goes from location and budget input to listing review, cost and freshness comprehension, listing detail, protected contact request, safety guidance, contact, and outcome reporting.

It is useful for UX design, acceptance testing, and identifying failure points. For example, the diagram makes it clear that safety guidance appears before the contact or payment-risk moment.

### 9.3 Moderation workflow diagram — process flowchart

**Diagram type:** Operational workflow or process flowchart.

**Question it answers:** How does a listing move from submission to publication, reconfirmation, suspension, or archival?

The process includes automated completeness checks, human review, requests for changes, publication with a verification level, freshness reminders, reconfirmation, and removal from active search when the listing becomes stale.

This diagram is especially important because the product’s success depends on catalogue quality. It also gives the operations team a common procedure to follow.

### 9.4 Data model diagram — entity-relationship diagram

**Diagram type:** Entity-relationship diagram, commonly abbreviated as ERD.

**Question it answers:** What are the core data entities, and how are they related?

The ERD shows that users submit listings, listings have costs and media, listings receive verification records, seekers create contact requests, users file reports, and users or listings generate audit events.

It is useful for database design, API planning, access control, reporting, and preventing duplicated or ambiguous data.

## 10. Architecture explained in plain language

The future MVP uses a responsive web client or PWA so the team does not need to fund native Android and iOS apps immediately. The client sends requests to an application API. The API applies permissions and business rules, then reads or writes the relational catalogue database.

Images are stored separately from structured data. Notifications use an external provider. Maps and geocoding are optional rather than foundational. Audit logs and analytics record operational events without exposing unnecessary personal details.

This architecture is intentionally simple. It keeps the system understandable, testable, and affordable to operate while the product is still proving its model.

## 11. Funding gates explained

The SRS defines different expectations for different funding levels.

### At 0 XAF

The deliverable is evidence. Use free tools, interview people, collect a small manual catalogue, test cost transparency, and record outcomes.

### At up to 100,000 XAF

Use the money for transport, phone/data, field verification, small participant support, simple outreach, and a reserve. Do not spend it on custom software or paid advertising before the manual workflow is validated.

### After external funding

Request technical quotes and build the Must-priority requirements first. Preserve human moderation and avoid adding payments, nationwide coverage, or advanced automation until the core housing journey is reliable.

## 12. Acceptance criteria explained

Acceptance criteria are the tests that determine whether the MVP is ready for a controlled pilot.

A successful MVP must allow public search, show transparent costs, prevent unreviewed publication, display freshness and verification, protect contact information, support reporting, capture the funnel, work on mobile, provide safety warnings, and have tested backup and access-control procedures.

These criteria convert the SRS from a descriptive document into a delivery checklist. An engineer should be able to implement a requirement, and a tester should be able to prove whether it works.

## 13. Recommended reading order for the team

A founder should read the executive decision, problem statement, scope, validation requirements, funding gates, and acceptance criteria first.

A designer should focus on stakeholders, search, cost transparency, contact flow, trust model, and the seeker workflow diagram.

An engineer should focus on functional requirements, non-functional requirements, data requirements, architecture, the system context diagram, and the ERD.

A moderator or field operator should focus on Stage A, listing states, verification levels, moderation requirements, the moderation workflow diagram, and the fraud and safety risks.

A potential funder should focus on the problem statement, validation gates, 0-to-100,000 XAF plan, MVP scope, risks, and measurable acceptance criteria.

## 14. Final interpretation

The SRS is not asking you to build a large application with 0 XAF. It is giving you a disciplined way to start small, learn at no cost, and avoid spending scarce capital on the wrong product.

The correct first deliverable is a **manual, safety-conscious housing discovery service**. The correct second deliverable is evidence that seekers want it, owners will participate, listings can be kept fresh, and the founder can operate the trust process. Only then should the software MVP be funded and built according to this SRS.

## References

[1]: https://housingfinanceafrica.org/country-detail/cameroon/ "Centre for Affordable Housing Finance in Africa — Cameroon country detail"

[2]: https://unhabitat.org/cameroon "UN-Habitat — Cameroon country profile"

[3]: https://prc.cm/en/multimedia/documents/10271-law-n-2024-017-of-23-12-2024-web "Presidency of the Republic of Cameroon — Law No. 2024/017 relating to personal data protection"
