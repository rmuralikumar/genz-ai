import { NextRequest } from "next/server";
import { handleGoogleOAuthCallback } from "@/app/auth/callback/route";

/**
 * Route handler for /api/auth/callback
 * Delegates to the primary OAuth callback handler so Google OAuth succeeds
 * whether the developer configured /auth/callback or /api/auth/callback in Google Cloud Console.
 */
export async function GET(req: NextRequest) {
  return handleGoogleOAuthCallback(req);
}
