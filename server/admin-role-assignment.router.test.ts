import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, setUserRole: vi.fn() };
});

import * as database from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const stamp = { createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin = { id: 10, openId: "local_admin", name: "Owner", email: "owner@example.com", loginMethod: "ahc_local", role: "admin" as const, isBanned: false, ...stamp };
const localUser = { ...admin, id: 11, openId: "local_user", role: "user" as const };

function caller(user: typeof admin | typeof localUser) {
  return appRouter.createCaller({ user, req: {}, res: {} } as unknown as TrpcContext);
}

describe("trusted staff role assignment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows only an Admin to assign a pre-existing AHC account as a Field Moderator", async () => {
    vi.mocked(database.setUserRole).mockResolvedValue({ success: true, role: "moderator" } as never);
    await expect(caller(admin).admin.setUserRole({ userId: 45, role: "moderator" })).resolves.toEqual({ success: true, role: "moderator" });
    expect(database.setUserRole).toHaveBeenCalledWith(admin.id, 45, "moderator");
    await expect(caller(localUser).admin.setUserRole({ userId: 45, role: "moderator" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
