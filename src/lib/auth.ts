import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE_NAME = "elitetrading_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "elitetrading-erp-super-secret-key-2026-prod"
);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
  permissions: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    roleName: user.roleName,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (!payload.sub) return null;
    return {
      id: String(payload.sub),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      roleName: String(payload.roleName || "VIEWER"),
      permissions: Array.isArray(payload.permissions)
        ? payload.permissions.map(String)
        : [],
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user) return null;

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: user.id }, { email: user.email }],
        isActive: true,
      },
      include: { role: true },
    });

    if (dbUser) {
      let permissions: string[] = [];
      try {
        permissions = JSON.parse(dbUser.role?.permissions || "[]");
      } catch {
        permissions = user.permissions;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        roleName: dbUser.role?.name || user.roleName,
        permissions,
      };
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error verifying user in getSession:", err);
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.COOKIE_SECURE === "true",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function hasPermission(user: SessionUser | null, perm: string): boolean {
  if (!user) return false;
  if (user.roleName === "ADMIN" || user.permissions.includes("*")) return true;
  return user.permissions.includes(perm);
}

export async function logActivity(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        summary: params.summary,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

