import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");

describe("reporter-owned reviewed-report updates", () => {
  it("stores a minimal notification record rather than staff evidence or an enforcement outcome", () => {
    expect(schemaSource).toContain("export const reportReviewUpdates");
    expect(schemaSource).toContain('recipientUserId: int("recipientUserId").notNull()');
    expect(schemaSource).toContain('readAt: timestamp("readAt")');
    expect(dbSource).toContain("Completes one Admin review and creates a generic acknowledgement for its reporter.");
    expect(dbSource).toContain("staff notes, evidence,");
    expect(dbSource).toContain("sanctions, other reporters, and enforcement outcomes remain private.");
  });

  it("scopes notification reads and read acknowledgements to the signed-in reporter", () => {
    expect(dbSource).toContain("eq(reportReviewUpdates.recipientUserId, userId)");
    expect(dbSource).toContain("eq(reportReviewUpdates.id, updateId)");
    expect(dbSource).toContain("Review update not found.");
    expect(routerSource).toContain("markReportReviewUpdateRead");
  });

  it("allows only an Admin procedure to complete a report review and create its acknowledgement", () => {
    expect(routerSource).toContain("resolveTrustReport: adminProcedure");
    expect(dbSource).toContain("if (report.status !== \"open\") throw new Error(\"This trust report has already been reviewed.\")");
    expect(dbSource).toContain('action: "trust_report_reviewed"');
    expect(dbSource).toContain("recipientUserId: report.reporterUserId");
  });
});
