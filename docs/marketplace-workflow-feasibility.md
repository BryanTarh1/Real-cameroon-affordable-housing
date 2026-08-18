# Marketplace Workflow Feasibility Record

**Updated:** 18 August 2026  
**Scope:** Four requested marketplace patterns adapted to Affordable Housing Cameroon (AHC). This record describes AHC’s own implementation and safety boundaries; it does not copy third-party code, branding, or proprietary operating material.

## 1. Total Move-In Cash and landmark-map discovery

**Decision: feasible and implemented.** AHC continues to show the calculated **Total Move-In Cash Required** as the primary public comparison figure. The detailed calculation remains behind the appropriate property-detail account boundary. Each public approximate landmark pin now also carries a compact Total Move-In Cash label.

The label is informational only. It is attached to the deliberately displaced, 200–500 m landmark point and does not expose an exact address, compound door, internal proof, or contact information.

## 2. Physical field verification

**Decision: feasible and implemented.** A listing can receive a physical-verification badge only through the Field Moderator evidence workflow. Evidence remains in authorised staff routes; public visitors see only the objective status.

Physical verification is a field observation with a saved expiry date, not a permanent promise about a property. The public listing projection resolves an expired or missing `physical_verified` expiry date to `unverified`. Listing freshness and verification validity are distinct checks: a recent reconfirmation does not silently renew a physical inspection.

## 3. Report-volume response

**Decision: automatic sanctions are not accepted; a safer alternative is implemented.** AHC does not suspend a listing, revoke a badge, or restrict an Agent merely because three accounts report it. Coordinated or low-quality reports could otherwise be used to harm a competitor.

When three distinct open reports of the same listing’s price inaccuracy or unavailability are present, AHC marks the case for **priority Admin review**. The private Admin report view includes the matching report count, reporter account age, and same-network pattern count. These are review signals, not automated guilt determinations. An authorised human must evaluate evidence and decide any action through the normal audited review workflow.

## 4. Tracked WhatsApp contact

**Decision: feasible and already enforced.** AHC records an authenticated seeker’s contact intent before returning the pre-filled WhatsApp hand-off URL. The public route exposes no private staff contact data beyond the intended hand-off; the Admin lead view remains role-protected and provides aggregate tracked counts.

AHC must not treat a lead event as a completed tenancy, a payment, an agreement, or an indication that any seeker shared a message outside the platform.

## Validation record

The implementation is protected by focused regression tests for public-verification expiry, priority review thresholds, approximate-map cash-label source markup, Admin-only lead access, and lead counts. The full suite passed **179 tests** and the production build completed successfully. Desktop and mobile public marketplace reviews were also completed.
