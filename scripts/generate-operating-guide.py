from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

OUT = Path("/home/ubuntu/ahc-deliverables/AHC-Platform-Operating-Guide.docx")

PAPER = "F7F3E9"
INK = "132C34"
MANGO = "D78A1D"
MIST = "E5EBE5"


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, value, bold=False, color=INK):
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(str(value))
    run.bold = bold
    run.font.name = "Aptos"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for i, header in enumerate(headers):
        shade(table.rows[0].cells[i], INK)
        set_cell_text(table.rows[0].cells[i], header, bold=True, color="FFFFFF")
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            if row_index % 2 == 0:
                shade(cells[i], PAPER)
            set_cell_text(cells[i], value)
    doc.add_paragraph()


def add_heading(doc, title, level=1):
    p = doc.add_heading(title, level=level)
    for run in p.runs:
        run.font.name = "Aptos Display" if level == 1 else "Aptos"
        run.font.color.rgb = RGBColor.from_string(INK if level == 1 else MANGO)
    return p


def add_body(doc, text, emphasis=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.line_spacing = 1.12
    if emphasis and emphasis in text:
        before, after = text.split(emphasis, 1)
        p.add_run(before)
        r = p.add_run(emphasis)
        r.bold = True
        r.font.color.rgb = RGBColor.from_string(MANGO)
        p.add_run(after)
    else:
        p.add_run(text)
    for run in p.runs:
        run.font.name = "Aptos"
        run.font.size = Pt(10.25)
        if not run.font.color.rgb:
            run.font.color.rgb = RGBColor.from_string(INK)
    return p


def add_callout(doc, title, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    shade(table.cell(0, 0), MIST)
    p = table.cell(0, 0).paragraphs[0]
    r = p.add_run(title + " ")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(INK)
    p.add_run(text)
    for run in p.runs:
        run.font.name = "Aptos"
        run.font.size = Pt(9.5)
    doc.add_paragraph()


def build_document():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.62)
    sec.bottom_margin = Inches(0.62)
    sec.left_margin = Inches(0.7)
    sec.right_margin = Inches(0.7)

    styles = doc.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"].font.size = Pt(10.25)

    title = doc.add_heading("Affordable Housing Cameroon", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title.runs:
        run.font.name = "Aptos Display"
        run.font.size = Pt(28)
        run.font.color.rgb = RGBColor.from_string(INK)
    subtitle = doc.add_paragraph("Platform Operating Guide — Marketplace, Trust Operations, Access Controls, and Daily Workflows")
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in subtitle.runs:
        run.italic = True
        run.font.name = "Aptos"
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor.from_string(MANGO)
    doc.add_paragraph()
    add_callout(doc, "Purpose.", "This editable Word guide explains how every AHC user level operates the current platform, which routes they may use, how core trust and payment controls work, and what must remain private. It reflects the non-production demonstration release of 13 August 2026.")

    add_heading(doc, "1. Platform purpose and operating principles")
    add_body(doc, "Affordable Housing Cameroon (AHC) is a high-trust rental marketplace for Yaoundé and Douala. The marketplace leads with Total Move-In Cash Required—the combined declared rent advance, deposit, agency fee, service fee, and first-month utilities—so a seeker can assess the actual entry cost before arranging a viewing.")
    add_body(doc, "The product is deliberately not an in-app chat, rent-collection, escrow, or deposit-holding service. AHC uses a tracked handoff to WhatsApp for contact, soft-pins listings to a landmark radius rather than a compound door, archives unreconfirmed listings after fourteen days, and gives staff separate protected workspaces for review and field verification.")
    add_table(doc, ["Principle", "How the platform applies it"], [
        ["Cost transparency", "The listing card and detail view foreground Total Move-In Cash Required and itemised components rather than presenting only monthly rent."],
        ["Freshness", "Agents reconfirm active listings. Inventory not reconfirmed within fourteen days is automatically removed from public search."],
        ["Location privacy", "Public maps use a 200–500 metre landmark radius; exact compound doors and moderator proof remain private."],
        ["Human trust controls", "First publication is moderated. Physical verification, evidence review, selected second visits, and held commission approval add independent checks."],
        ["Non-custodial safety", "AHC may charge defined platform-service fees but never receives, routes, holds, or guarantees tenancy rent, deposits, or agent commissions."],
    ])

    add_heading(doc, "2. User levels, named demonstration actors, and access")
    add_body(doc, "AHC has anonymous visitors, authenticated users, Field Moderators, and Administrators. Seeker, Agent, and Owner applicant are distinct operating positions within the ordinary user role. Staff roles are never exposed through public registration.")
    add_table(doc, ["Actor", "Defined demonstration role", "Primary route", "Fixture purpose"], [
        ["Tarh", "Seeker", "Public search; protected property action", "Tests sign-in-gated details, reports, viewing requests, match consent, and tracked lead intent."],
        ["Ebot", "Paid Agent", "/agent", "Tests active Growth access and one available listing credit."],
        ["Mireille", "Paid Douala Agent", "/agent", "Owns varied Douala inventory and tests a second active supply account."],
        ["Nadege", "Pending-payment Agent", "/agent", "Tests the paid-access gate without publishing authority or paid credits."],
        ["Ateh", "Owner applicant", "/agent", "Tests stronger owner onboarding: identity, land-title, occupancy-right, and supporting documents."],
        ["Robinson", "Field Moderator", "/operations", "Tests field proof, review work, verification batches, and Operations-only records."],
        ["Bryan", "Administrator", "/admin", "Tests role governance, payment reconciliation, safety holds, audits, and held-commission approval."],
    ])
    add_callout(doc, "Credential warning.", "All named accounts are clearly labelled non-production fixtures ending in @test.ahc.local. They are for controlled demonstration only and must be deleted or replaced before a public launch.")

    add_heading(doc, "3. Authentication, sessions, and route boundaries")
    add_body(doc, "AHC authentication is an explicit local-account sign-in. A successful sign-in issues an HTTP-only AHC local JWT cookie. New credentials use bcryptjs hashing, while an already verified legacy scrypt credential is upgraded at the next successful sign-in. Five failed attempts lock the credential for fifteen minutes, and a session expires after thirty days.")
    add_table(doc, ["Route or action", "Who may enter", "Visible boundary before access"], [
        ["/", "Anyone", "Public search and public freshness/trust signals render without a login."],
        ["/property/:listingId", "Public entry; account required for protected actions", "A normal browser enters the hash-routed SPA. Social crawlers receive a public-only metadata document."],
        ["/agent", "Signed-in ordinary user with the relevant supply status", "Agent sign-in or registration appears before paid workspace controls."],
        ["/operations and /operations/batches", "Field Moderator or Administrator", "A Field Moderator sign-in-only panel appears for visitors and ordinary accounts."],
        ["/admin", "Administrator only", "An Admin sign-in-only panel appears for visitors, seekers, Agents, and Moderators."],
        ["/acceptance", "Administrator only", "An owner-led role-by-role acceptance exercise appears only after an explicit Admin sign-in."],
    ])
    add_body(doc, "The frontend boundary prevents unnecessary workspace rendering, but the server is the enforcement point. Protected procedures independently check the AHC local session and required role. Preview state, a remembered page, or knowledge of a URL does not unlock a workspace.")
    add_callout(doc, "Owner acceptance walkthrough.", "After signing in as an Administrator, open /#/acceptance or use the Admin workspace link. The in-site exercise teaches a safe, ordered check of Anonymous Visitor, Seeker, Paid Agent, Owner applicant, Field Moderator, and Admin workflows. It stores only completion checkmarks in the current browser; it does not store passwords, change platform data, or replace server audit records.")

    add_heading(doc, "4. Seeker workflow")
    add_body(doc, "A seeker begins on the public marketplace. They can filter available Yaoundé and Douala homes by city, neighbourhood text, maximum Total Move-In Cash Required, and physical-verification status. Cards show the total cost, monthly rent as supporting context, landmark-radius map scope, approved public badges, neighbourhood essentials, and relative freshness without exposing private evidence.")
    add_table(doc, ["Step", "Seeker action", "Platform response"], [
        ["1. Discover", "Search public inventory or open a shared property link.", "Shows fresh public listing data only. An ordinary shared link redirects to /#/property/:listingId so refreshes remain safe in the SPA."],
        ["2. Review", "Open a listing or use View full home details from a verified Walk-Thru card.", "Presents the cost breakdown, landmark area, disclosures, freshness, and verified public trust signals."],
        ["3. Authenticate", "Sign in or register when taking an account-required action.", "Creates an AHC seeker session; the user can then request a viewing, report a concern, save alert consent, or contact supply."],
        ["4. Contact", "Select Chat on WhatsApp.", "AHC records a privacy-minimised authenticated lead-intent event first, then redirects to the responsible Agent or Owner’s pre-filled WhatsApp chat. AHC cannot read the message body."],
        ["5. Report", "Report inaccurate costs, unavailability, misleading details, or an unofficial AHC fee demand.", "Reports enter protected staff review. Fair-review safeguards and automatic holds apply according to the trust workflow."],
        ["6. Arrange", "Request a viewing window and contact preference.", "The responsible Agent confirms, declines, cancels, or records the appointment outcome; private histories are role-scoped."],
    ])

    add_heading(doc, "5. Agent and Owner applicant workflow")
    add_body(doc, "Agents register through the public supply entry and provide identity and proof-of-work information. Owner applicants face a stronger onboarding package that includes identity, land-title, occupancy-right, and supporting-property material. Neither path confers moderator or administrative authority.")
    add_table(doc, ["Stage", "Agent / Owner activity", "Control or outcome"], [
        ["Access", "Sign in at /agent and complete the relevant profile.", "Paid access and listing credits are separate platform-service controls. Nadege’s fixture demonstrates a pending-payment boundary."],
        ["Create listing", "Enter city, landmark area, property details, itemised costs, availability, map-radius scope, and required supply information.", "AHC calculates Total Move-In Cash Required. The submission enters review; it does not publish automatically."],
        ["Review", "Respond to clarification or correction requests.", "First publication is moderator controlled; refused or incomplete information cannot be made public by the Agent."],
        ["Maintain freshness", "Use one-click reconfirmation within fourteen days.", "A stale listing is automatically archived from public search until it is properly reconfirmed."],
        ["Manage contact and viewings", "Receive WhatsApp handoffs and manage private appointment requests.", "The platform records only defined lead and appointment records; it does not take rent or deposit payments."],
    ])

    add_heading(doc, "6. Field Moderator workflow")
    add_body(doc, "Robinson’s Field Moderator role is reached through /operations after explicit AHC sign-in. This workspace is for operational evidence and never appears on public cards. The Moderator can inspect the review queue, claim eligible assignments, and use the geographic route board to group approximate city and landmark-area work without revealing an exact public address.")
    add_table(doc, ["Stage", "Field Moderator task", "Required safeguard"], [
        ["Claim", "Claim an eligible paid verification order or route-batch assignment.", "Assignment and conflict rules prevent uncontrolled parallel handling."],
        ["Visit", "Assess whether the compound, exterior, room flow, and declared details match the listing.", "The Moderator records a structured result; the public listing does not expose the raw proof."],
        ["Evidence", "Upload at least required comparison and supporting proof, and where premium verification applies, a 15–30 second vertical on-site Walk-Thru video.", "Only an assigned Field Moderator may upload media. Evidence history remains in protected Operations/Admin records."],
        ["Neighbourhood", "Record observed water access, power reliability, road access, taxi walk, and junction context.", "Approved observations become public practical badges; unapproved evidence and raw notes remain protected."],
        ["Audit", "Complete a selected independent second visit when assigned.", "A different Moderator must perform the selected audit before related held commission approval is possible."],
    ])

    add_heading(doc, "7. Administrator workflow")
    add_body(doc, "Bryan’s Administrator role uses /admin. It is the governance workspace, not a public market page. Administrators assign or revoke staff roles, manage bans, govern platform-service settings, reconcile payment orders, review trust risk, inspect protected evidence and audit history, and approve held Field Moderator commissions only after evidence review.")
    add_table(doc, ["Administrative control", "What the Administrator does", "What the Administrator must not do"], [
        ["Role management", "Assign known AHC accounts to moderator or admin after operational verification; remove access when required.", "Create staff authority through public registration or share credentials."],
        ["Listing safety", "Review reports, account-age and network-pattern context, holds, and outcomes.", "Treat a report alone as conclusive proof or publicly expose a reporter’s private information."],
        ["Payments", "Reconcile defined AHC platform-service orders and review receipt records.", "Accept, hold, route, guarantee, or disburse rent, deposits, or tenancy settlement money."],
        ["Verification payout", "Review required evidence, independent-audit status, and commission note before release approval.", "Pay the Field Moderator’s held share before the evidence gate and required second-verifier conditions are met."],
    ])

    add_heading(doc, "8. Video discovery, property links, and social previews")
    add_body(doc, "Verified premium Walk-Thru cards present a short vertical video only where approved on-site evidence exists. Each card includes an accessible View full home details action. Selecting it opens the related property flow; the seeker can then review itemised terms, sign in when required, and use the tracked WhatsApp contact handoff.")
    add_body(doc, "AHC keeps a durable public share URL at /property/:listingId. A normal browser receives a 302 redirect into /#/property/:listingId, avoiding blank-page failures on direct entry or refresh in the SPA. Recognised WhatsApp and other social crawlers receive a small server-rendered document with public-only OpenGraph title, description, URL, and generated share-card image. The metadata intentionally contains the listing title, city/neighbourhood, landmark-area language, and Total Move-In Cash Required—not proof URLs, audit notes, raw coordinates, or private contact data.")

    add_heading(doc, "9. Trust signals, reports, and information privacy")
    add_table(doc, ["Public marketplace may show", "Protected staff records must remain in /operations or /admin"], [
        ["Physical-verification badge, approved Direct Owner or price-transparency badges, neighbourhood essentials, Total Move-In Cash Required, approximate map radius, and relative reconfirmation freshness.", "Raw Moderator photographs, video-upload history, comparison findings, structured evidence, independent-audit records, private report context, lead-event audit views, precise operational assignment details, and commission approval notes."],
        ["The public Walk-Thru discovery card and a link to the corresponding listing detail.", "The Field Moderator’s proof media beyond the intentionally approved public Walk-Thru publication, and all evidence needed to decide verification or payout."],
    ])
    add_body(doc, "A protected report can trigger an automatic safety hold after the defined threshold and safeguards. A hold removes the listing from public discovery and suspends related agent access pending Admin investigation. AHC preserves the distinction between a public verified badge and the protected evidentiary record used to justify it.")

    add_heading(doc, "10. Match alerts, appointments, and provider boundaries")
    add_body(doc, "A signed-in seeker may opt in to match-alert preferences such as a city, bedroom count, or monthly-rent limit. When a Moderator approves a matching listing, AHC can create a deduplicated provider-pending delivery record. Live WhatsApp delivery remains disabled until an approved WhatsApp Business provider, message template, webhook, and response-event path are configured.")
    add_body(doc, "Viewing requests are a concierge record rather than a payment or in-app chat product. The seeker proposes a future window and privacy-scoped contact preference. The responsible Agent can confirm, decline with a reason, cancel, and record a completed or no-show outcome. Landmark privacy remains in place until the parties make their own confirmed-arrangement decision.")

    add_heading(doc, "11. Daily operating checklist")
    add_table(doc, ["Role", "Beginning of day", "During work", "End of day"], [
        ["Agent / Owner", "Review paid access, current listings, appointment queue, and reconfirmation dates.", "Keep itemised costs accurate, answer leads responsibly, and submit changes before they become stale.", "Reconfirm live homes, update availability, and never request undeclared or unofficial AHC fees."],
        ["Field Moderator", "Review assigned work and batched landmark areas only after signing in.", "Collect genuine evidence, record comparisons and neighbourhood observations, and flag mismatches.", "Complete evidence records; do not export private proof or publish it outside authorised AHC media."],
        ["Administrator", "Review role requests, held listings, payment reconciliations, reports, and pending approvals.", "Investigate evidence and fair-review context; apply role, ban, payout, or listing decisions through protected controls.", "Review audit events and outstanding operational exceptions; keep credentials and staff access current."],
    ])

    add_heading(doc, "12. Implementation, testing, and release references")
    add_body(doc, "The current release includes an expanded clearly labelled non-production fixture set with named actors and varied Yaoundé/Douala inventory; protected-authentication regression coverage; public shared-property routing coverage; role-authorisation coverage; payment-credit, trust-report, match-alert, review-audit, and viewing-appointment tests. The reusable database fixture is scripts/seed-temporary-demo.mjs, and its credential/state validator is scripts/validate-temporary-demo.mjs.")
    add_table(doc, ["Area", "Primary internal reference"], [
        ["Roles and AHC local authentication", "docs/AHC-Roles-and-Authentication-Reference.md"],
        ["Non-custodial payment policy", "docs/NON_CUSTODIAL_PAYMENT_POLICY.md"],
        ["Match-alert provider boundary", "docs/PREMIUM_MATCH_ALERT_PROVIDER_NOTES.md"],
        ["Named non-production accounts", "docs/AHC-Non-Production-Test-Accounts.md"],
        ["Public shared-link decisions", "server/_core/sharedPropertyLink.ts"],
        ["Server social metadata and tracked WhatsApp route", "server/_core/index.ts"],
        ["Marketplace UI and property detail", "client/src/pages/Home.tsx"],
        ["Premium Walk-Thru rail", "client/src/components/PremiumWalkthroughRail.tsx"],
    ])
    add_callout(doc, "Launch reminder.", "Before public launch, remove all @test.ahc.local data, rotate administrative credentials, verify consent wording and local legal requirements, configure a real approved alert provider if required, and conduct a production access review for Admin and Operations accounts.")

    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = footer.add_run("Affordable Housing Cameroon · Operating Guide · Non-production release reference")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor.from_string(INK)
    doc.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_document()
