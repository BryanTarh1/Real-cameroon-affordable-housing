# AHC Paid Launch Operating Model

## Decision

AHC will be **paid from the first agent action that creates commercial inventory**. Renters remain free to search, compare the full move-in cost, view approximate landmark areas, report concerns, and contact a published agent through WhatsApp. Agents do not receive a free listing tier. They purchase a paid listing pass before a new property can enter the AHC review queue.

This protects the marketplace from casual or stale supply while maintaining a low initial barrier for professional agents. AHC must not charge tenants to reveal basic listing information or initiate first contact.

## Recommended launch offers

| Offer | Launch price | Validity / unit | Operational result |
|---|---:|---|---|
| Listing Pass | 1,000 XAF | One new listing submission | Unlocks one listing for moderator review. It does not guarantee approval or publication. |
| Featured Landmark Pin | 3,000 XAF | 14 days | Eligible only after the listing is published; a moderator activates the highlight after payment reconciliation. |
| Physical Verification | 7,500 XAF | Per listing | Funds a field-check request. The badge is issued only after a moderator records a passed verification outcome. |
| Agent Access | 3,000 XAF | 30 days | Maintains an agent workspace, supports reconfirmation, and includes one listing pass; further listings require another pass. |

These are **pilot assumptions**, not permanent market prices. The first 30 days should measure payment completion, review time, agent retention, and the field cost of each physical verification before the amounts are changed.

## Payment approach

The interface will support **MTN MoMo** and **Orange Money** as the intended merchant collection rails. Both providers publish merchant collection or web-payment capabilities; Orange lists Cameroon among its supported merchant markets.[1][2]

Until AHC has completed merchant onboarding and safely configured provider credentials, the product must use a controlled **payment-reference reconciliation** workflow rather than pretend that a payment was automatically captured. An agent chooses the offer, receives an order reference and the platform’s current payment instructions, submits the provider transaction reference, and an authorized operations user confirms or rejects it. No listing, badge, or promotion is activated merely because a reference was typed.

## Listing review lifecycle

```text
Agent creates profile
      ↓
Agent purchases listing pass
      ↓
Payment reference submitted → pending reconciliation
      ↓
Operations confirms payment → paid listing credit
      ↓
Agent submits listing → under review
      ↓
Moderator checks identity, itemized costs, landmark-only map location, availability, and policy compliance
      ↓
Approve → published → agent reconfirms every 14 days
Request correction → returned to agent → resubmit
Reject → archived → recorded reason retained for audit
```

## Non-negotiable controls

| Control | Implementation rule |
|---|---|
| No self-publication | `reconfirm` can refresh only a listing already `published` or `needs_reconfirmation`; it never changes `under_review` to `published`. |
| Reviewer separation | Only `admin` or `moderator` may assign, approve, correct, reject, reconcile a payment, or award a physical-verification outcome. |
| Payment before review | A new listing requires a paid, unused listing credit. A rejected listing may have its credit restored by an operations decision. |
| Auditability | Every review decision stores reviewer, action, reason, timestamp, and resulting status. |
| Field-badge integrity | A physical-verification badge is granted only after a passed verification order, not when it is purchased. |
| Safety of revenue claims | The public marketplace describes the badge, freshness rule, and approximate location exactly; it does not imply a government guarantee or a financial guarantee. |

## Same-domain operational authority

AHC uses one application domain with two protected operational routes. This avoids a second staff website, preserves one audit surface, and lets a small Yaoundé/Douala team scale from a single administrator to city-based field coverage without changing the renter journey.

| Role | Protected route | Authority | Explicit boundary |
|---|---|---|---|
| **Admin** | `/admin` | Adjusts launch fees and the field-share rule; reviews confirmed cash-flow records; manages account suspensions; and audits platform activity. | An Admin must not treat a typed MTN MoMo or Orange Money reference as proof of payment without supporting evidence. Fee changes affect new orders only; historical orders retain their original amount. |
| **Field Moderator** | `/operations` | Claims paid field visits, records visit evidence, and passes or fails physical verification. | A Field Moderator never exposes an exact compound coordinate, and a paid request never creates a public badge until a passed outcome is recorded. |
| **Agent** | Paid workspace | Purchases access and listing passes, submits commercial inventory, reconfirms availability, and requests verification. | An agent cannot self-publish or refresh an inactive subscription. |
| **Renter** | Public marketplace | Searches Total Move-In Cash Required, views landmark-radius areas, checks relative freshness, and starts a WhatsApp conversation. | Search and first contact remain free; renters are never asked to pay to reveal basic listing information. |

## Field-verification commission record

Each passed paid physical verification creates an immutable allocation record. The launch default is **80% to the Field Moderator and 20% to AHC**, calculated from the original verification-order amount. At the 7,500 XAF pilot price, this records **6,000 XAF field accrual** and **1,500 XAF platform accrual**. The Admin may adjust the percentage for future field visits, but the recorded allocation for a completed visit is never recalculated retroactively.

This is an operational accrual record, not a bank-settlement mechanism. The Admin must retain the underlying payment evidence, the field outcome, and the eventual payout evidence separately until an appropriate merchant and payout workflow is in place.

## References

[1] [MTN MoMo API — Collection](https://momo.mtn.com/api/)

[2] [Orange Money Web Payment / M Payment API](https://developer.orange.com/apis/om-webpay)
