# Affordable Housing Cameroon: Seven-Feature Live Testing Walkthrough

**Live site:** <https://affordableho-8aahm5dj.manus.space/>  
**Prepared for:** AHC owner and test team  
**Purpose:** Test each of the seven newly released marketplace safeguards without changing genuine customer listings or using real personal data unnecessarily.

> **Important:** Use the appropriate Seeker, Agent, and Moderator/Admin test accounts. For cost changes, duplicate checks, and appointment outcomes, use a clearly identified test listing rather than an active real-world home. Do not upload private addresses, identity documents, or fabricated customer feedback.

## Start here: role and route map

| Role | Sign-in point | Main workspace | What to test |
|---|---|---|---|
| Seeker | Open a property and select the sign-in option when protected details are needed | Public marketplace home page | Budget fit, price history, private post-viewing outcome, low-data mode |
| Agent | Open <https://affordableho-8aahm5dj.manus.space/#/agent> and sign in | Agent workspace | Viewing availability, cost disclosures, quality dashboard |
| Moderator or Admin | Open <https://affordableho-8aahm5dj.manus.space/#/operations> and sign in | Operations workspace | Duplicate-review queue |

The **48-hour availability safeguard** needs both a Seeker and the Agent who owns the listing. The **private post-viewing outcome** needs a completed appointment. For that reason, run Features 2 and 5 in the sequence shown below.

---

## 1. Test the Budget-Fit Calculator

This feature helps a signed-in Seeker narrow fresh homes using two personal planning figures: monthly income and cash available today. It is a guide only; it does not approve a tenancy or provide a loan decision.

| Step | What to do | What you should see |
|---|---|---|
| 1 | Sign in as a **Seeker**, then return to the public home page. | The homes area contains a card headed **“BUDGET FIT”**. |
| 2 | Scroll to **Fresh inventory**. | The budget card appears above the listing filters. |
| 3 | Enter a test monthly income, such as `150000`, in **Monthly income (XAF)**. | The field accepts numbers only. |
| 4 | Enter test move-in savings, such as `350000`, in **Savings available today (XAF)**. | The field accepts numbers only. |
| 5 | Select **Show homes that fit my budget**. | Only homes whose monthly rent is at or below the 30% planning guide and whose total move-in cash is within the savings figure remain visible. |
| 6 | Select **Show all fresh homes** to return to the normal catalogue. | The complete filtered catalogue returns. |

**Pass condition:** The catalogue changes only after valid income and savings figures are supplied. The page clearly states that this is planning guidance, not a loan or tenancy decision.

---

## 2. Test the 48-Hour Availability Confirmation

This workflow prevents a Seeker from travelling for a viewing that the Agent has not recently reconfirmed. First, the Agent publishes a time; next, the Seeker requests it; finally, the Agent must reconfirm availability before confirming or declining the visit.

### A. Agent: publish a test viewing slot

| Step | What to do | What you should see |
|---|---|---|
| 1 | Sign in as the **Agent** who owns a test listing and open the Agent workspace. | The protected Agent workspace loads. |
| 2 | Find **Viewing slots**. | The section explains that Seekers request a time but the Agent controls confirmation. |
| 3 | Choose the dedicated test listing. | The listing title appears in the selector. |
| 4 | Choose a future date and time. | The date-and-time field accepts the selection. |
| 5 | Select **Publish 1-hour slot**. | A new `open` slot appears in the list. |

### B. Seeker: request that specific slot

| Step | What to do | What you should see |
|---|---|---|
| 1 | Sign in as a **Seeker** and open the same test listing from the home page. | The listing detail window opens. |
| 2 | In **AVAILABLE VIEWING SLOTS**, enter a test WhatsApp or phone number. | The contact field accepts the test value. |
| 3 | Optionally add a short note, such as “Testing the requested time.” | The note remains private to the appointment workflow. |
| 4 | Select the published time. | A success message says that the viewing request was sent. |

### C. Agent: reconfirm and decide

| Step | What to do | What you should see |
|---|---|---|
| 1 | Return to the Agent workspace and open **Viewing concierge**. | The requested viewing appears with a due date. |
| 2 | Select **Reconfirm availability**. | The interface confirms availability. |
| 3 | Select **Confirm**. Add a brief confirmation note if useful. | The appointment becomes confirmed; the Seeker’s contact information is revealed only as part of the confirmed workflow. |

**Expiry check:** If the Agent does not reconfirm the request within 48 hours, the live background safeguard checks every 30 minutes and expires the stale request. Do not wait 48 hours just to test this on a real customer request; use a controlled test record if a full expiry test is required.

---

## 3. Test Price History and Change Disclosure

Every Agent cost change is dated and kept as a disclosure for signed-in Seekers. This makes a later rent, advance, or fee change visible alongside the Agent’s reason.

| Step | What to do | What you should see |
|---|---|---|
| 1 | Sign in as the Agent who owns a **dedicated test listing**. | The Agent inventory is visible. |
| 2 | Find that test listing and select **Change with disclosure**. | A cost editor opens with rent, advance, deposit, agency fee, service fee, and first-month utilities. |
| 3 | Make a small, safe test change and write a truthful reason of at least six characters, for example “Test price disclosure.” | The reason is required. |
| 4 | Select **Save disclosure**. | A confirmation message states that the cost change was disclosed. |
| 5 | Sign in as a Seeker, open the same listing, and view its protected details. | A **PRICE DISCLOSURE** section headed **Recent cost changes** shows the date, Agent reason, and previous versus current monthly rent. |

**Pass condition:** A Seeker can see the disclosure but cannot alter it. The cost history is not a public review and does not expose private Agent evidence.

---

## 4. Test the Duplicate-Listing Detector and Staff Review

The detector creates a **risk signal**, not an automatic penalty. It uses matching public listing facts such as phone number, landmark, media, or highly similar description to flag a possible re-post. A Moderator or Admin must make the final decision.

| Step | What to do | What you should see |
|---|---|---|
| 1 | Use only a controlled test listing to submit a deliberately similar second test listing. Do not copy a genuine customer’s content. | The normal submission process completes; the listing is not automatically removed or punished. |
| 2 | Sign in as a **Moderator or Admin** at <https://affordableho-8aahm5dj.manus.space/#/operations>. | The restricted Operations workspace opens. |
| 3 | At the top, find **00 — Duplicate-review signals**. | A queue may display the possible match, its confidence percentage, and a non-punitive explanation. |
| 4 | Read the listing facts and write a reason in **Required reviewer reason**. | The decision buttons activate only after a meaningful reason is entered. |
| 5 | For a harmless test, select **Dismiss signal**. | A confirmation reports that the duplicate-review decision was recorded. |

**Pass condition:** A signal alone never hides, rejects, or penalises a listing. The Operations audit trail records the human reviewer’s reason and decision.

---

## 5. Test the Structured Private Post-Viewing Outcome

This feature replaces public ratings with a private structured check after a confirmed visit. The Seeker may state whether the home matched the listing, the price differed, it was already rented, or the visit did not occur.

| Step | What to do | What you should see |
|---|---|---|
| 1 | Complete Feature 2 through Agent confirmation, using a test viewing slot. | The Seeker’s **Scheduled visits** section shows the appointment as confirmed. |
| 2 | After the scheduled start time has passed, the Agent opens **Viewing concierge**. | The Agent can select **Mark complete** or **Record no-show** for the confirmed visit. |
| 3 | For this test, select **Mark complete**. | The appointment moves into the completed workflow. |
| 4 | Return to the Seeker account and scroll to **Scheduled visits** on the home page. | A **POST-VIEWING OUTCOME** section appears, headed **How did the viewing go?** |
| 5 | Select the listing title, choose **Matched the listing**, **Price differed**, **Already rented**, or **Did not attend**, then optionally add a note. | The selected outcome and note are shown only in the private workflow. |
| 6 | Select **Record private outcome**. | A success message confirms that the private outcome was recorded. |

**Pass condition:** No public star rating, testimonial, or review is created. The information instead supports availability and price-accuracy operations.

---

## 6. Test the Agent Quality Dashboard

The Agent dashboard reports only measurable AHC events. It deliberately does not create public ratings or claim a response speed that the system cannot verify.

| Step | What to do | What you should see |
|---|---|---|
| 1 | Sign in as an Agent and open the Agent workspace. | The protected Agent workspace loads. |
| 2 | Find **Agent quality dashboard**. | The panel states that its indicators use only verifiable AHC events. |
| 3 | Review the indicators. | You may see listing freshness, tracked WhatsApp leads, completed viewings, availability reconfirmations, and price-difference signals. |
| 4 | Complete controlled actions from Features 2, 3, and 5, then refresh the Agent workspace. | Relevant metrics may increase once the saved platform events are included. |

**Pass condition:** The dashboard is private to the Agent and uses platform activity, not invented reviews, public star ratings, or customer testimonials.

---

## 7. Test Low-Data Listing Mode

Low-data mode keeps the essential trust information available while reducing automatic media loading. It is intended for mobile users with limited data bundles or weak connections.

| Step | What to do | What you should see |
|---|---|---|
| 1 | Open the public home page on a phone or browser. Sign-in is not required. | The fresh inventory filters are visible. |
| 2 | In the filter row, select **Use data saver**. | The button changes to **Data saver on**. |
| 3 | Inspect the listing cards. | Video autoplay/preview is replaced by a lighter “Data saver: media on tap” placeholder, while total move-in cash, freshness, location area, and trust details remain. |
| 4 | Confirm that the premium walkthrough rail is hidden. | The page is lighter but continues to show the fresh listing catalogue. |
| 5 | Select **Data saver on** again to turn the feature off. | Media-led browsing returns. |

**Pass condition:** The mode changes media behaviour only. It must not remove the listing’s total move-in cash, freshness indicator, verification information, or safe landmark-level location context.

---

## Recommended test order and completion record

Run the workflows in this order to avoid prerequisites blocking later tests.

| Order | Feature | Test account(s) | Mark complete when |
|---|---|---|---|
| 1 | Low-data mode | Anyone | Data saver switches on and off without losing essential listing facts. |
| 2 | Budget fit | Seeker | Budgeted results appear and reset correctly. |
| 3 | Viewing availability | Agent + Seeker | A slot is requested, reconfirmed, then confirmed. |
| 4 | Price disclosure | Agent + Seeker | A test cost change and reason appear in protected recent cost changes. |
| 5 | Post-viewing outcome | Agent + Seeker | A completed test appointment accepts one private structured outcome. |
| 6 | Agent quality dashboard | Agent | Verifiable indicators are visible and reflect relevant platform events. |
| 7 | Duplicate review | Moderator/Admin | A test duplicate signal receives a documented human decision. |

When a test does not behave as described, take a screenshot of the page, include the account role and approximate time, and report the exact button or section that did not appear. Do not share passwords, real ID images, or a customer’s private contact information in a screenshot.
