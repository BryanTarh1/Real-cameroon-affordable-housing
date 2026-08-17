const SOCIAL_PREVIEW_BOT = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot/i;

/** Determines whether a request should receive the minimal public social-preview document. */
export function isSocialPreviewBot(userAgent: string) {
  return SOCIAL_PREVIEW_BOT.test(userAgent);
}

/** Provides the normal browser path that opens a shared public listing in the AHC app. */
export function propertySpaRedirect(listingId: string) {
  return `/property/${encodeURIComponent(listingId)}`;
}
