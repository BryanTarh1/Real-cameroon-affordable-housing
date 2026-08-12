# AHC schema gap analysis

## Existing schema strengths

The supplied MariaDB export already provides four useful domains. `listings` stores the public property identity, urban location vocabulary, availability, freshness date, workflow status, verification JSON, submitting user, agent name, and photo count. `costs` already models the six required cost components: rent, advance, deposit, agency fee, service fee, and utilities. `users` separates seeker, owner, and moderator roles. `reports` provides a basic listing-level abuse or accuracy report workflow.

## Required derived value

For every published listing, the platform should calculate:

`total_move_in_cash_required = rent + advance + deposit + agency_fee + service_fee + utilities`

The implementation must distinguish a known zero from an unknown NULL value. If one or more components are unknown, the listing should show an explicit `Estimate incomplete` state rather than silently treating missing values as zero. The total can be calculated server-side for sorting and API responses and recalculated in the UI for immediate feedback in listing forms.

## Important mismatches with the new prompt

| Requirement | Current schema | Required implementation decision |
|---|---|---|
| WhatsApp deep link | No agent phone field | Add `agent_phone` to `users` or a dedicated agent profile table; normalize to Cameroon international format before generating `wa.me` links. |
| Leaflet map | No coordinates | Add approximate `map_lat`, `map_lng`, `map_radius_m`, and optionally a landmark label. Never expose exact compound coordinates. |
| 200–500 m approximate radius | No privacy geometry | Store a privacy-safe point generated inside a configured 200–500 m radius from the internal reference point; publish only the approximate point and radius. |
| 14-day archival rule | `freshness_window_days` defaults to 21 | Enforce a product invariant of 14 days for live inventory. A scheduled job or request-time query must archive stale published listings. |
| Agent subscriptions | No plan or subscription tables | Add `agent_plans`, `agent_subscriptions`, and a minimal subscription status model. Avoid hard paywalls for seekers. |
| Featured map pins | No featured fields | Add `featured_until`, `featured_priority`, and a payment/status record. Featured treatment must be time-bounded and visibly labeled. |
| Physical verification badge | Verification JSON exists | Define a structured verification schema or child table with `verification_type`, `verified_at`, `verified_by`, `expires_at`, `fee_amount`, and evidence status. |
| Monetization auditability | No payments or ledger | Add transaction records for subscriptions, featured pins, and verification fees. Do not infer payment success from a frontend click. |
| Agent identity | `agent_name` duplicated on listing | Keep snapshot for display history, but use `submitted_by_id` and agent profile data as the authoritative relationship. |
| Image assets | Only `photos_count` | Add a `listing_photos` table or an external media reference field when real uploads are introduced. |
| Availability freshness | `available_from` and `last_reconfirmed` exist | Add indexes on `status`, `last_reconfirmed`, `city`, `neighborhood`, and `property_type` for public search and archival jobs. |

## Suggested additive tables

`agent_profiles` can hold phone, agency name, WhatsApp opt-in, and public contact preferences. `listing_locations` can hold internal reference coordinates, public approximate coordinates, radius, landmark text, and privacy generation metadata. `agent_plans` and `agent_subscriptions` can define plan limits and dates. `listing_promotions` can represent featured pins. `verification_orders` can represent physical verification requests and payment state. `payment_events` should record provider references and immutable status transitions. `listing_photos` should store URLs, sort order, and moderation state.

## Freshness invariant

A listing is public only when `status = 'published'` and `last_reconfirmed >= CURRENT_DATE - INTERVAL 14 DAY`. A scheduled archival routine should update stale records to `archived` or `needs_reconfirmation`; the public API should enforce the same predicate so stale listings cannot leak through if the job is delayed.

## Implementation caution

The supplied export contains no seed records, no payment provider integration, no migration versioning, and no agent phone or coordinate data. The first implementation should therefore use migrations and clearly labeled development fixtures only in a non-production environment. Production listing data must come from the database and should not be fabricated.
