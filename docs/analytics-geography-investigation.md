# Analytics Geography Investigation

## Scope

The public document loads the configured Umami tracker using the environment-provided analytics endpoint and website identifier. No raw analytics events, visitor IP addresses, referrers, or dashboard access are available in the application repository, so this investigation cannot identify an individual source for any single pageview.

## Evidence and interpretation

The currently available evidence supports treating a country label as an **IP-derived analytics classification**, not proof that a human visitor is physically located in that country. The official Umami configuration documentation states that the service uses a configured client IP header when operating behind a proxy and otherwise performs IP-based location detection using a GeoIP database. Its Cloudflare guidance also states that visitor location information depends on forwarding location headers through the proxy. Therefore, gateway, monitoring, preview, proxy, VPN, crawler, or shared-network traffic can be recorded with a location that differs from the intended audience’s physical location.

Umami documents that recognised bots are excluded by default, but this does not demonstrate that every automated request is excluded. First-party preview, deployment, health-check, browser-testing, and unrecognised automated traffic should therefore be considered when interpreting a new site’s small early count.

## Responsible next steps

Do not treat the displayed United States count as a business lead, a customer count, or evidence of American market interest. Compare **unique visitors** with pageviews; review date/time, page path, referrer, and device/browser breakdowns in the analytics dashboard; and watch whether the same pattern persists after genuine outreach begins. Avoid collecting more identifying data merely to resolve this question.

## Sources

1. Umami, [Environment variables](https://umami.is/docs/environment-variables), accessed 2026-08-18. Documents `CLIENT_IP_HEADER`, `GEO_DATABASE_URL`, `IGNORE_IP`, and default bot exclusion.
2. Umami, [Enable Cloudflare headers](https://docs.umami.is/docs/enable-cloudflare-headers), accessed 2026-08-18. Documents location-header forwarding and proxy configuration for country, region, and city determination.
