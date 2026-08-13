import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createSeekerMatchAlertPreference: vi.fn(),
    listSeekerMatchAlertPreferences: vi.fn(),
    listSeekerMatchAlertDeliveries: vi.fn(),
    revokeSeekerMatchAlertPreference: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const seeker = { id: 718, openId: "seeker_match_alert", name: "Alert Seeker", email: "seeker@example.com", role: "user" as const, isBanned: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function caller(user = seeker) {
  return appRouter.createCaller({ user, req: { protocol: "https", headers: {} }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as unknown as TrpcContext);
}

describe("consented WhatsApp match alerts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps alert creation authenticated", async () => {
    await expect(caller(null as never).marketplace.matchAlerts.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("normalizes and persists explicit seeker consent criteria", async () => {
    vi.mocked(database.createSeekerMatchAlertPreference).mockResolvedValue({ id: 15, active: true });
    await expect(caller().marketplace.matchAlerts.create({
      whatsappPhone: "6 99 12 34 56", city: "Yaoundé", neighborhood: "Jouvence", minBedrooms: 2, maxMonthlyRent: 80_000, maxMoveInCash: 300_000,
    })).resolves.toEqual({ id: 15, active: true });
    expect(database.createSeekerMatchAlertPreference).toHaveBeenCalledWith(seeker.id, expect.objectContaining({ city: "Yaoundé", neighborhood: "Jouvence", minBedrooms: 2, maxMonthlyRent: 80_000, maxMoveInCash: 300_000 }));
    expect(vi.mocked(database.createSeekerMatchAlertPreference).mock.calls[0][1].whatsappPhone).toMatch(/^237/);
  });

  it("rejects invalid city choices and prevents a cross-account preference revocation", async () => {
    await expect(caller().marketplace.matchAlerts.create({ whatsappPhone: "699123456", city: "Bafoussam" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    vi.mocked(database.revokeSeekerMatchAlertPreference).mockResolvedValue({ success: true });
    await caller().marketplace.matchAlerts.revoke({ preferenceId: 21 });
    expect(database.revokeSeekerMatchAlertPreference).toHaveBeenCalledWith(seeker.id, 21);
  });
});
