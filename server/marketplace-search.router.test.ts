import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, listFreshPublicListings: vi.fn() };
});

import * as database from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousCaller() {
  return appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} }, res: {} } as unknown as TrpcContext);
}

describe("public marketplace discovery filters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts and forwards only stored-data-backed filter criteria for anonymous discovery", async () => {
    vi.mocked(database.listFreshPublicListings).mockResolvedValue([]);

    await expect(anonymousCaller().marketplace.search({
      city: "Yaoundé",
      propertyType: "Apartment",
      furnishingStatus: "partly_furnished",
      neighborhood: "Jouvence",
      minBedrooms: 2,
      availability: "available_now",
      maxMonthlyRent: 100_000,
      maxMoveInCash: 350_000,
      verification: "physical_verified",
    })).resolves.toEqual([]);

    expect(database.listFreshPublicListings).toHaveBeenCalledWith(expect.objectContaining({
      city: "Yaoundé",
      propertyType: "Apartment",
      furnishingStatus: "partly_furnished",
      neighborhood: "Jouvence",
      minBedrooms: 2,
      availability: "available_now",
      maxMonthlyRent: 100_000,
      maxMoveInCash: 350_000,
      verification: "physical_verified",
    }));
  });

  it("rejects unsupported availability, furnishing, and bedroom values", async () => {
    await expect(anonymousCaller().marketplace.search({ availability: "tomorrow" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(anonymousCaller().marketplace.search({ furnishingStatus: "luxury" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(anonymousCaller().marketplace.search({ minBedrooms: -1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
