import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

const SECRET_KEY = process.env.AUTH_SECRET || "genz-ai-super-secret-default-key-32-chars-long";
const key = new TextEncoder().encode(SECRET_KEY);

export const SESSION_COOKIE_NAME = "genz_session";

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        settings: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error reading authenticated user session:", error);
    return null;
  }
}
