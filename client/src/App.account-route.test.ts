import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

describe("protected customer account route", () => {
  it("keeps the documented account URL behind the same role-aware customer dashboard guard", () => {
    expect(appSource).toContain('<Route path="/account" component={CustomerDashboardRoute} />');
    expect(appSource).toContain('function CustomerDashboardRoute()');
    expect(appSource).toContain('<ProtectedWorkspace allowedRoles={["seeker"]}><CustomerDashboard /></ProtectedWorkspace>');
  });
});
