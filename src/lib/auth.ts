import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { one } from "./db";
import type { SessionUser } from "./types";

export type { SessionUser };
export { hashPassword, verifyPassword } from "./password";

const COOKIE = "meridian_token";

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "meridian-dev-secret-change-me");
}

export async function signToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setSession(user: SessionUser) {
  const token = await signToken(user);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role),
      tenantId: payload.tenantId ? String(payload.tenantId) : null,
      tenantName: payload.tenantName ? String(payload.tenantName) : null,
    };
  } catch {
    return null;
  }
}

export function findUserByEmail(email: string) {
  return one<SessionUser & { password_hash: string; tenant_id: string | null; tenant_name: string | null; tenant_status: string | null }>(
    `SELECT u.id, u.name, u.email, u.role, u.password_hash, u.tenant_id,
            t.name AS tenant_name, t.status AS tenant_status
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = ?`,
    [email.toLowerCase()],
  );
}

export function toSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id?: string | null;
  tenant_name?: string | null;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id ?? null,
    tenantName: user.tenant_name ?? null,
  };
}
