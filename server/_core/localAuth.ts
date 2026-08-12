import { timingSafeEqual, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import type { Request } from "express";
import { parse } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { AHC_LOCAL_SESSION_COOKIE, AHC_LOCAL_SESSION_MAX_AGE_MS } from "../../shared/const";
import { getUserById } from "../db";
import { ENV } from "./env";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;

function localSessionSecret() {
  return new TextEncoder().encode(`${ENV.cookieSecret}:ahc-local-session:v1`);
}

export async function hashLocalPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyLocalPassword(password: string, encodedHash: string) {
  const [algorithm, salt, expected] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  const expectedBuffer = Buffer.from(expected, "base64url");
  return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
}

export async function createLocalSessionToken(user: Pick<User, "id" | "role">) {
  const expiresAt = Math.floor((Date.now() + AHC_LOCAL_SESSION_MAX_AGE_MS) / 1000);
  return new SignJWT({ provider: "ahc_local", role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(localSessionSecret());
}

export async function authenticateLocalRequest(req: Request): Promise<User | null> {
  const token = parse(req.headers.cookie ?? "")[AHC_LOCAL_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, localSessionSecret(), { algorithms: ["HS256"] });
    if (payload.provider !== "ahc_local" || typeof payload.sub !== "string" || !/^\d+$/.test(payload.sub)) return null;
    return (await getUserById(Number(payload.sub))) ?? null;
  } catch {
    return null;
  }
}
