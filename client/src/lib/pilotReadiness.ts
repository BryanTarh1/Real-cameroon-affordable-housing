export type PilotSummaryCounts = {
  currentEligibleHomes?: number;
  verificationDueSoon?: number;
  agentSubmissionsAwaitingReview?: number;
  viewingRequestsAwaitingResponse?: number;
  confirmedViewings?: number;
  completedViewings?: number;
  openSafetyReports?: number;
};

export type PilotReadinessItem = {
  id: "supply" | "freshness" | "submissions" | "viewings" | "safety";
  tone: "clear" | "watch" | "action";
  title: string;
  detail: string;
};

const count = (value: number | undefined) => value ?? 0;
const plural = (value: number, singular: string, pluralWord = `${singular}s`) => `${value} ${value === 1 ? singular : pluralWord}`;

/**
 * Creates operational next steps from actual summary counts. It deliberately
 * does not declare a pilot “ready” or invent a target number of homes.
 */
export function getPilotReadinessItems(summary?: PilotSummaryCounts): PilotReadinessItem[] {
  const eligible = count(summary?.currentEligibleHomes);
  const dueSoon = count(summary?.verificationDueSoon);
  const submissions = count(summary?.agentSubmissionsAwaitingReview);
  const viewingRequests = count(summary?.viewingRequestsAwaitingResponse);
  const reports = count(summary?.openSafetyReports);

  return [
    eligible > 0
      ? { id: "supply", tone: "clear", title: `${plural(eligible, "current eligible home")}`, detail: "Keep each public home current and evidence-approved before sharing it more widely." }
      : { id: "supply", tone: "action", title: "No current eligible homes", detail: "Complete real media approval and a current Field Moderator review before inviting Seekers." },
    dueSoon > 0
      ? { id: "freshness", tone: "watch", title: `${plural(dueSoon, "review")} due soon`, detail: "Ask the responsible Agent to reconfirm before the current review expires." }
      : { id: "freshness", tone: "clear", title: "No reviews due within 3 days", detail: "Continue checking freshness as the pilot grows." },
    submissions > 0
      ? { id: "submissions", tone: "action", title: `${plural(submissions, "Agent submission")} awaiting review`, detail: "Review each submission before it becomes a public home." }
      : { id: "submissions", tone: "clear", title: "No Agent submissions awaiting review", detail: "Agent intake is clear at the moment." },
    viewingRequests > 0
      ? { id: "viewings", tone: "action", title: `${plural(viewingRequests, "viewing request")} awaiting response`, detail: "Confirm, reschedule, or cancel each request without revealing an exact location early." }
      : { id: "viewings", tone: "clear", title: "No viewing requests awaiting response", detail: "Keep using the privacy-safe request and confirmation flow." },
    reports > 0
      ? { id: "safety", tone: "action", title: `${plural(reports, "open safety report")}`, detail: "Finish human review before treating the pilot as clear of current safety concerns." }
      : { id: "safety", tone: "clear", title: "No open safety reports", detail: "Continue giving every report a human-reviewed outcome." },
  ];
}
