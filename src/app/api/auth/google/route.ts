import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGoogleOAuthConfig, resolveAppOrigin } from "@/lib/auth/google_config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { clientId, clientSecret, isConfigured } = getGoogleOAuthConfig();
  const origin = resolveAppOrigin(req);

  const hasClientId = Boolean(clientId && !clientId.includes("your-google-client-id"));
  const hasClientSecret = Boolean(clientSecret && !clientSecret.includes("your-google-client-secret"));

  if (!isConfigured) {
    console.error("[Google OAuth] Credentials not detected in runtime environment:", {
      hasClientId,
      hasClientSecret,
      nodeEnv: process.env.NODE_ENV,
    });
    const errorMsg = encodeURIComponent(
      "Google sign-in is temporarily unavailable. Please configure Google OAuth credentials."
    );
    const errResponse = NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
    errResponse.headers.set("X-Google-Client-Id-Configured", String(hasClientId));
    errResponse.headers.set("X-Google-Client-Secret-Configured", String(hasClientSecret));
    return errResponse;
  }

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/auth/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("access_type", "offline");

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Attach CSRF state cookie directly to redirect response and cookieStore
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  response.headers.set("X-Google-Client-Id-Configured", "true");
  response.headers.set("X-Google-Client-Secret-Configured", "true");

  return response;
}

