import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  signSessionToken,
  setSessionCookie,
  logActivity,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(user.role.permissions || "[]");
    } catch {
      permissions = [];
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleName: user.role.name,
      permissions,
    };

    const token = await signSessionToken(sessionUser);
    await setSessionCookie(token);

    await logActivity({
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      summary: `${user.name} signed in`,
    });

    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

