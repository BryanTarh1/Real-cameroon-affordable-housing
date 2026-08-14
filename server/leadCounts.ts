export type AdminLeadAuditEvent = {
  id: number;
  listingId: string;
  seekerUserId: number;
  contactUserId: number | null;
  channel: string;
  createdAt: Date;
  listingTitle: string;
  city: string;
  neighborhood: string | null;
};

/**
 * Produces the privacy-limited Admin overview: one row per listing with a
 * cumulative contact-intent count. The underlying lead-event table remains
 * append-only for audit purposes; no WhatsApp content or phone numbers appear.
 */
export function summarizeAdminLeadEvents(events: AdminLeadAuditEvent[]) {
  const byListing = new Map<string, AdminLeadAuditEvent & { clickCount: number; seekerIds: Set<number>; firstClickedAt: Date; lastClickedAt: Date }>();

  for (const event of events) {
    const existing = byListing.get(event.listingId);
    if (!existing) {
      byListing.set(event.listingId, { ...event, clickCount: 1, seekerIds: new Set([event.seekerUserId]), firstClickedAt: event.createdAt, lastClickedAt: event.createdAt });
      continue;
    }
    existing.clickCount += 1;
    existing.seekerIds.add(event.seekerUserId);
    if (event.createdAt < existing.firstClickedAt) existing.firstClickedAt = event.createdAt;
    if (event.createdAt > existing.lastClickedAt) existing.lastClickedAt = event.createdAt;
  }

  return Array.from(byListing.values())
    .sort((left, right) => right.lastClickedAt.getTime() - left.lastClickedAt.getTime())
    .map(({ seekerIds, ...event }) => ({
      ...event,
      uniqueSeekerCount: seekerIds.size,
    }));
}
