import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = (name: string) => readFileSync(resolve(process.cwd(), "client", "src", "pages", name), "utf8");

describe("payment-governance workspace separation", () => {
  it("keeps reconciliation controls out of Field Moderator Operations", () => {
    const operations = pageSource("OperationsPortal.tsx");

    expect(operations).not.toContain("operations.paymentQueue");
    expect(operations).not.toContain("operations.reconcilePayment");
    expect(operations).not.toContain("Payment reconciliation");
    expect(operations).toContain("Your verification commission status");
  });

  it("places official service-order reconciliation in the Admin workspace", () => {
    const admin = pageSource("AdminPortal.tsx");

    expect(admin).toContain("trpc.admin.paymentQueue");
    expect(admin).toContain("trpc.admin.reconcilePayment");
    expect(admin).toContain("Official service-order reconciliation");
    expect(admin).toContain("AHC never reconciles rent, deposits, or tenancy settlements");
  });
});
