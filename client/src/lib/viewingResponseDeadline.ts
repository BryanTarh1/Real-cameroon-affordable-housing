export type ViewingResponseDeadlineState = "overdue" | "due_soon" | "scheduled";

/**
 * Classifies a server-issued availability-confirmation deadline without changing
 * the appointment itself. The Agent UI uses this only to order attention; the
 * server remains authoritative for every response and status transition.
 */
export function classifyViewingResponseDeadline(
  dueAt: string | Date | number,
  now: string | Date | number = new Date(),
): ViewingResponseDeadlineState {
  const remainingMs = new Date(dueAt).getTime() - new Date(now).getTime();
  if (remainingMs <= 0) return "overdue";
  if (remainingMs <= 24 * 60 * 60 * 1000) return "due_soon";
  return "scheduled";
}
