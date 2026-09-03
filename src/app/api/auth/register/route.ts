import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/passwords";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and initialize settings
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || email.split("@")[0],
        settings: {
          create: {
            theme: "dark",
            defaultModel: "genz-fast",
            enterToSend: true,
            autoScroll: true,
            compactMode: false,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        settings: true,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again later." },
      { status: 500 }
    );
  }
}
