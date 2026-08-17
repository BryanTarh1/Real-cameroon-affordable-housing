import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const portal = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/PaidAgentPortal.tsx"), "utf8");
const adminPortal = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/AdminPortal.tsx"), "utf8");
const locale = fs.readFileSync(path.resolve(process.cwd(), "client/src/lib/agentWorkspaceLocale.ts"), "utf8");

describe("dual Mobile Money payment experience", () => {
  it("keeps MTN MoMo and Orange Money as the only selectable Agent payment rails", () => {
    expect(portal).toContain('value="mtn_momo"');
    expect(portal).toContain('value="orange_money"');
    expect(portal).not.toContain('<option value="other">');
  });

  it("explains the provider-specific, Admin-reconciled service-payment boundary in English and French", () => {
    expect(portal).toContain("payment-provider-guidance");
    expect(portal).toContain('copy("mtnPaymentGuide")');
    expect(portal).toContain('copy("orangePaymentGuide")');
    expect(locale).toContain("A submitted reference is not an official receipt.");
    expect(locale).toContain("Une référence envoyée n’est pas un reçu officiel.");
    expect(locale).toContain("Never share a Mobile Money PIN");
  });

  it("shows the submitted provider to the protected Admin reconciliation queue and preserves receipt gating", () => {
    expect(adminPortal).toContain("order.provider.replaceAll");
    expect(adminPortal).toContain("Confirm platform service");
    expect(portal).toContain("order.officialReceiptCode &&");
  });
});
