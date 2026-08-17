import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createViewingAppointment: vi.fn(),
    respondToViewingAppointment: vi.fn(),
    reconfirmViewingAppointmentAvailability: vi.fn(),
    recordSeekerViewingOutcome: vi.fn(),
  };
});

import * as database from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const authenticatedUser = {
  id: 913,
  openId: "appointment-test-user",
  email: "seeker@example.com",
  name: "Appointment Seeker",
  loginMethod: "ahc_local",
  role: "user" as const,
  isBanned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function caller(user = authenticatedUser) {
  return appRouter.createCaller({ user, req: { protocol: "https", headers: {} }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as unknown as TrpcContext);
}

describe("AHC viewing appointment concierge", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a signed-in seeker before a private viewing request can be created", async () => {
    const api = caller(null as never);
    await expect(api.marketplace.appointments.request({
      listingId: "LST-TEST-001", requestedStart: new Date(Date.now() + 86_400_000), requestedEnd: new Date(Date.now() + 90_000_000),
      contactPreference: "whatsapp", privateContact: "+237690000000", seekerNote: "Available after work.",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(database.createViewingAppointment).not.toHaveBeenCalled();
  });

  it("passes an authenticated seeker request to the protected appointment service", async () => {
    vi.mocked(database.createViewingAppointment).mockResolvedValue({ id: 73, status: "requested" } as never);
    const start = new Date(Date.now() + 86_400_000);
    const end = new Date(start.getTime() + 3_600_000);
    await expect(caller().marketplace.appointments.request({
      listingId: "LST-TEST-001", requestedStart: start, requestedEnd: end,
      contactPreference: "whatsapp", privateContact: "+237690000000", seekerNote: "Available after work.",
    })).resolves.toMatchObject({ id: 73, status: "requested" });
    expect(database.createViewingAppointment).toHaveBeenCalledWith(expect.objectContaining({
      seekerUserId: authenticatedUser.id, listingId: "LST-TEST-001", contactPreference: "whatsapp", privateContact: "+237690000000",
    }));
  });

  it("requires a substantive reason before an Agent declines a viewing request", async () => {
    await expect(caller().agent.viewingAppointments.respond({ appointmentId: 73, decision: "declined" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(database.respondToViewingAppointment).not.toHaveBeenCalled();
  });

  it("passes an Agent availability reconfirmation through the protected workflow", async () => {
    vi.mocked(database.reconfirmViewingAppointmentAvailability).mockResolvedValue({
      id: 73,
      availabilityStatus: "confirmed",
    } as never);

    await expect(caller().agent.viewingAppointments.reconfirmAvailability({ appointmentId: 73 }))
      .resolves.toMatchObject({ availabilityStatus: "confirmed" });
    expect(database.reconfirmViewingAppointmentAvailability).toHaveBeenCalledWith({
      agentUserId: authenticatedUser.id,
      appointmentId: 73,
    });
  });

  it("keeps post-viewing outcomes structured and private to the authenticated seeker", async () => {
    vi.mocked(database.recordSeekerViewingOutcome).mockResolvedValue({
      appointmentId: 73,
      outcome: "price_differed",
    } as never);

    await expect(caller().marketplace.appointments.recordSeekerOutcome({
      appointmentId: 73,
      outcome: "price_differed",
      note: "The requested advance was higher than the listing showed.",
    })).resolves.toMatchObject({ outcome: "price_differed" });
    expect(database.recordSeekerViewingOutcome).toHaveBeenCalledWith({
      seekerUserId: authenticatedUser.id,
      appointmentId: 73,
      outcome: "price_differed",
      note: "The requested advance was higher than the listing showed.",
    });
  });
});
