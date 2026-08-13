import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getUserById: vi.fn() }));

import { getUserById } from "./db";
import { authenticateLocalRequest, createLocalSessionToken, hashLocalPassword, verifyLocalPassword } from "./_core/localAuth";
import { AHC_LOCAL_SESSION_COOKIE } from "../shared/const";

const user = { id: 92, role: "user" as const, openId: "local_92", email: "agent@example.com", name: "AHC Agent", loginMethod: "ahc_local", isBanned: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("AHC local session primitives", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hashes new passwords with bcrypt and verifies correct and incorrect credentials", async () => {
    const first = await hashLocalPassword("correct horse battery staple");
    const second = await hashLocalPassword("correct horse battery staple");
    expect(first).toMatch(/^\$2[aby]\$12\$/);
    expect(first).not.toBe(second);
    await expect(verifyLocalPassword("correct horse battery staple", first)).resolves.toBe(true);
    await expect(verifyLocalPassword("wrong password", first)).resolves.toBe(false);
  });

  it("resolves only a valid AHC-local session token to the corresponding account", async () => {
    vi.mocked(getUserById).mockResolvedValue(user as never);
    const token = await createLocalSessionToken(user);
    const request = { headers: { cookie: `${AHC_LOCAL_SESSION_COOKIE}=${token}` } } as never;
    await expect(authenticateLocalRequest(request)).resolves.toMatchObject({ id: user.id, loginMethod: "ahc_local" });
    expect(getUserById).toHaveBeenCalledWith(user.id);
  });
});
