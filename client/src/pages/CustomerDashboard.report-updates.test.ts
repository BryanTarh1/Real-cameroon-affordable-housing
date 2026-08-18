import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("./CustomerDashboard.tsx", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("./AdminPortal.tsx", import.meta.url), "utf8");

describe("private safety-report review updates", () => {
  it("renders completed report updates only from the protected dashboard contract", () => {
    expect(dashboardSource).toContain("const reportUpdates = dashboard.data.reportUpdates ?? []");
    expect(dashboardSource).toContain('id="safety-report-updates-title"');
    expect(dashboardSource).toContain("AHC has completed the reviews below");
    expect(dashboardSource).toContain("reportUpdates.map(update");
  });

  it("does not disclose staff notes, other reports, proof, or enforcement outcomes", () => {
    expect(dashboardSource).toContain("this notice does not reveal staff notes, other reports, evidence, or any action taken");
    expect(dashboardSource).not.toContain("update.note");
    expect(dashboardSource).not.toContain("update.reporterUserId");
  });

  it("provides an Admin-only completion control that refreshes the private review queue", () => {
    expect(adminSource).toContain("trpc.admin.resolveTrustReport.useMutation");
    expect(adminSource).toContain("Complete review & notify reporter");
    expect(adminSource).toContain("utils.admin.trustReports.invalidate()");
  });
});
