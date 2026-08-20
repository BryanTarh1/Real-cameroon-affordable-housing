import { describe, expect, it } from "vitest";
import { getPilotReadinessItems } from "./pilotReadiness";

describe("pilot readiness guidance", () => {
  it("uses only current counts to identify actions without declaring a pilot ready", () => {
    const items = getPilotReadinessItems({
      currentEligibleHomes: 0,
      verificationDueSoon: 2,
      agentSubmissionsAwaitingReview: 1,
      viewingRequestsAwaitingResponse: 3,
      openSafetyReports: 1,
    });

    expect(items.find(item => item.id === "supply")).toMatchObject({ tone: "action", title: "No current eligible homes" });
    expect(items.find(item => item.id === "viewings")?.detail).toContain("without revealing an exact location early");
    expect(items.some(item => item.title.toLowerCase().includes("pilot ready"))).toBe(false);
  });

  it("reports clear operational states when the tracked queues are empty", () => {
    const items = getPilotReadinessItems({ currentEligibleHomes: 2, verificationDueSoon: 0, agentSubmissionsAwaitingReview: 0, viewingRequestsAwaitingResponse: 0, openSafetyReports: 0 });

    expect(items).toHaveLength(5);
    expect(items.every(item => item.tone === "clear")).toBe(true);
    expect(items.find(item => item.id === "supply")?.title).toBe("2 current eligible homes");
  });
});
