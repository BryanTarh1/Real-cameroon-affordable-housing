import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createLocalAgentAccount: vi.fn(),
    getLocalCredentialByEmail: vi.fn(),
    recordLocalLoginFailure: vi.fn(),
    clearLocalLoginFailures: vi.fn(),
    upgradeLocalCredentialPasswordHash: vi.fn(),
  };
});

vi.mock("./_core/localAuth", async importOriginal => {
  const actual = await importOriginal<typeof import("./_core/localAuth")>();
  return {
    ...actual,
    hashLocalPassword: vi.fn().mockResolvedValue("$2b$12$bcrypttesthash"),
    verifyLocalPassword: vi.fn(),
    isLegacyScryptPasswordHash: vi.fn().mockReturnValue(false),
    createLocalSessionToken: vi.fn().mockResolvedValue("ahc-local-token"),
  };
});

import * as database from "./db";
import * as localAuth from "./_core/localAuth";
import { appRouter } from "./routers";
import { AHC_LOCAL_SESSION_COOKIE } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const stamp = { createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const localAgent = { id: 91, openId: "local_91", email: "agent@example.com", name: "Local Agent", loginMethod: "ahc_local", role: "user" as const, isBanned: false, ...stamp };

function caller() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx = {
    user: null,
    req: { protocol: "https", headers: {} },
    res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) },
  } as unknown as TrpcContext;
  return { caller: appRouter.createCaller(ctx), cookies };
}

function localAgentCaller() {
  const ctx = {
    user: localAgent,
    req: { protocol: "https", headers: {} },
    res: {},
  } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("AHC-owned local agent authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registers an independent local agent and issues the isolated AHC session cookie", async () => {
    vi.mocked(database.createLocalAgentAccount).mockResolvedValue(localAgent as never);
    const { caller: api, cookies } = caller();
    await expect(api.auth.registerLocalAgent({ name: "Local Agent", email: "AGENT@EXAMPLE.COM", password: "strong-password" })).resolves.toMatchObject({ id: localAgent.id, loginMethod: "ahc_local" });
    expect(database.createLocalAgentAccount).toHaveBeenCalledWith({ name: "Local Agent", email: "agent@example.com", passwordHash: "$2b$12$bcrypttesthash" });
    expect(cookies).toEqual([expect.objectContaining({ name: AHC_LOCAL_SESSION_COOKIE, value: "ahc-local-token", options: expect.objectContaining({ httpOnly: true, secure: true, maxAge: 2_592_000_000 }) })]);
  });

  it("does not disclose whether an unknown email has an AHC account", async () => {
    vi.mocked(database.getLocalCredentialByEmail).mockResolvedValue(null as never);
    const { caller: api, cookies } = caller();
    await expect(api.auth.loginLocalAgent({ email: "missing@example.com", password: "incorrect" })).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "Invalid email or password." });
    expect(localAuth.hashLocalPassword).toHaveBeenCalledWith("incorrect");
    expect(cookies).toHaveLength(0);
  });

  it("rejects a banned agent even when their password is correct", async () => {
    vi.mocked(database.getLocalCredentialByEmail).mockResolvedValue({ credential: { passwordHash: "$2b$12$bcrypttesthash", lockedUntil: null }, user: { ...localAgent, isBanned: true } } as never);
    vi.mocked(localAuth.verifyLocalPassword).mockResolvedValue(true);
    const { caller: api, cookies } = caller();
    await expect(api.auth.loginLocalAgent({ email: localAgent.email, password: "strong-password" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(database.clearLocalLoginFailures).not.toHaveBeenCalled();
    expect(cookies).toHaveLength(0);
  });

  it("signs in an active local agent and resets earlier failed-attempt state", async () => {
    vi.mocked(database.getLocalCredentialByEmail).mockResolvedValue({ credential: { passwordHash: "$2b$12$bcrypttesthash", lockedUntil: null }, user: localAgent } as never);
    vi.mocked(localAuth.verifyLocalPassword).mockResolvedValue(true);
    const { caller: api, cookies } = caller();
    await expect(api.auth.loginLocalAgent({ email: localAgent.email, password: "strong-password" })).resolves.toMatchObject({ id: localAgent.id });
    expect(database.clearLocalLoginFailures).toHaveBeenCalledWith(localAgent.id);
    expect(cookies[0]).toMatchObject({ name: AHC_LOCAL_SESSION_COOKIE, value: "ahc-local-token" });
  });

  it("upgrades a verified legacy scrypt credential to bcrypt before issuing the AHC JWT", async () => {
    vi.mocked(database.getLocalCredentialByEmail).mockResolvedValue({ credential: { passwordHash: "scrypt$legacy$hash", lockedUntil: null }, user: localAgent } as never);
    vi.mocked(localAuth.verifyLocalPassword).mockResolvedValue(true);
    vi.mocked(localAuth.isLegacyScryptPasswordHash).mockReturnValue(true);
    const { caller: api, cookies } = caller();

    await expect(api.auth.loginLocalAgent({ email: localAgent.email, password: "strong-password" })).resolves.toMatchObject({ id: localAgent.id });
    expect(database.upgradeLocalCredentialPasswordHash).toHaveBeenCalledWith(localAgent.id, "$2b$12$bcrypttesthash");
    expect(cookies[0]).toMatchObject({ name: AHC_LOCAL_SESSION_COOKIE, value: "ahc-local-token" });
  });

  it("keeps a locally authenticated agent out of Admin and Field Moderator controls", async () => {
    const api = localAgentCaller();

    await expect(api.admin.cashFlowAudit()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(api.operations.reviewQueue()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
