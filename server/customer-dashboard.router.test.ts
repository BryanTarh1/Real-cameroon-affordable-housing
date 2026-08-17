import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getCustomerDashboard: vi.fn(),
    updateCustomerDisplayName: vi.fn(),
    getAgentOfficialServiceReceipt: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const customer = {
  id: 4_201,
  openId: "customer-dashboard-test",
  email: "customer@example.com",
  name: "Customer Test",
  loginMethod: "ahc_local",
  role: "user" as const,
  isBanned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function caller(user = customer) {
  return appRouter.createCaller({ user, req: { protocol: "https", headers: {} }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as unknown as TrpcContext);
}

describe("AHC customer dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not expose dashboard data without an authenticated session", async () => {
    await expect(caller(null as never).account.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(database.getCustomerDashboard).not.toHaveBeenCalled();
  });

  it("loads dashboard data strictly for the authenticated customer", async () => {
    vi.mocked(database.getCustomerDashboard).mockResolvedValue({ profile: { id: customer.id }, orders: [] } as never);
    await expect(caller().account.dashboard()).resolves.toMatchObject({ profile: { id: customer.id }, orders: [] });
    expect(database.getCustomerDashboard).toHaveBeenCalledWith(customer.id);
  });

  it("keeps profile changes scoped to the authenticated customer and validates names", async () => {
    vi.mocked(database.updateCustomerDisplayName).mockResolvedValue({ id: customer.id, name: "Updated Customer" } as never);
    await expect(caller().account.updateDisplayName({ name: "Updated Customer" })).resolves.toMatchObject({ name: "Updated Customer" });
    expect(database.updateCustomerDisplayName).toHaveBeenCalledWith(customer.id, "Updated Customer");
    await expect(caller().account.updateDisplayName({ name: "X" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requests a receipt with the signed-in customer identity as the ownership boundary", async () => {
    vi.mocked(database.getAgentOfficialServiceReceipt).mockResolvedValue({ id: "PAY-421", status: "confirmed" } as never);
    await expect(caller().account.officialServiceReceipt({ orderId: "PAY-421" })).resolves.toMatchObject({ id: "PAY-421" });
    expect(database.getAgentOfficialServiceReceipt).toHaveBeenCalledWith(customer.id, "PAY-421");
  });
});
