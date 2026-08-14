export const LISTING_FRESHNESS_WINDOW_DAYS = 14;

const MILLISECONDS_PER_DAY = 86_400_000;

/** Returns the whole-day availability window remaining after the latest agent reconfirmation. */
export function daysUntilRefresh(value: Date | string, now = Date.now()) {
  const reconfirmedAt = new Date(value).getTime();
  if (!Number.isFinite(reconfirmedAt)) return 0;

  const expiry = reconfirmedAt + LISTING_FRESHNESS_WINDOW_DAYS * MILLISECONDS_PER_DAY;
  return Math.max(0, Math.ceil((expiry - now) / MILLISECONDS_PER_DAY));
}

export function formatReconfirmedDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date unavailable";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Gives public cards a plain-language freshness signal without exposing operational timestamps. */
export function relativeReconfirmed(value: Date | string, now = Date.now()) {
  const reconfirmedAt = new Date(value).getTime();
  if (!Number.isFinite(reconfirmedAt)) return "recently";

  const elapsedDays = Math.max(0, Math.floor((now - reconfirmedAt) / MILLISECONDS_PER_DAY));
  if (elapsedDays === 0) return "today";
  if (elapsedDays === 1) return "yesterday";
  return `${elapsedDays} days ago`;
}
