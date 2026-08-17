export const LISTING_FRESHNESS_WINDOW_DAYS = 14;

const MILLISECONDS_PER_DAY = 86_400_000;

/** Returns the whole-day availability window remaining after the latest agent reconfirmation. */
export function daysUntilRefresh(value: Date | string, now = Date.now()) {
  const reconfirmedAt = new Date(value).getTime();
  if (!Number.isFinite(reconfirmedAt)) return 0;

  const expiry = reconfirmedAt + LISTING_FRESHNESS_WINDOW_DAYS * MILLISECONDS_PER_DAY;
  return Math.max(0, Math.ceil((expiry - now) / MILLISECONDS_PER_DAY));
}

export function formatReconfirmedDate(value: Date | string, language: "en" | "fr" = "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "fr" ? "date indisponible" : "date unavailable";

  return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Gives public cards a plain-language freshness signal without exposing operational timestamps. */
export function relativeReconfirmed(value: Date | string, language: "en" | "fr" = "en", now = Date.now()) {
  const reconfirmedAt = new Date(value).getTime();
  if (!Number.isFinite(reconfirmedAt)) return language === "fr" ? "récemment" : "recently";

  const elapsedDays = Math.max(0, Math.floor((now - reconfirmedAt) / MILLISECONDS_PER_DAY));
  if (elapsedDays === 0) return language === "fr" ? "aujourd’hui" : "today";
  if (elapsedDays === 1) return language === "fr" ? "hier" : "yesterday";
  return language === "fr" ? `il y a ${elapsedDays} jours` : `${elapsedDays} days ago`;
}
