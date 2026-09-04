import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/passwords";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getGoogleOAuthConfig, resolveAppOrigin } from "@/lib/auth/google_config";

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function handleGoogleOAuthCallback(req: NextRequest) {
  const origin = resolveAppOrigin(req);
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // 1. Handle cancelled or failed authentication from Google
  if (error) {
    let message = "Google sign-in is temporarily unavailable. Please try again.";
    if (error === "access_denied") {
      message = "Google sign-in was cancelled.";
    } else if (error === "redirect_uri_mismatch") {
      message = "Google OAuth redirect URI mismatch. Please verify Authorized Redirect URIs in Google Cloud Console.";
    } else if (errorDescription) {
      message = errorDescription;
    }
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(message)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("No authorization code received from Google.")}`
    );
  }

  // 2. Validate CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!savedState || !state || savedState !== state) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("Authentication session expired or state mismatch. Please try again.")}`
    );
  }

  const { clientId, clientSecret, isConfigured } = getGoogleOAuthConfig();

  if (!isConfigured) {
    console.error(
      "[Google OAuth] Cannot complete OAuth callback: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing or not configured in process.env / .env."
    );
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("Google OAuth client configuration is missing.")}`
    );
  }

  // Authoritative callback redirect URI matching the authorization initiation URI
  const redirectUri = `${origin}/auth/callback`;

  try {
    // 3. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError: GoogleTokenResponse = await tokenResponse.json().catch(() => ({}));
      console.error("Failed to exchange code for token with Google:", tokenError);

      let userFriendlyMsg = "Failed to authenticate with Google. Please try again.";
      if (tokenError.error === "redirect_uri_mismatch") {
        userFriendlyMsg = "Google OAuth redirect URI mismatch. Please verify Authorized Redirect URIs in Google Cloud Console.";
      } else if (tokenError.error === "invalid_client") {
        userFriendlyMsg = "Google OAuth client credentials are invalid or expired.";
      }

      return NextResponse.redirect(
        `${origin}/?auth_error=${encodeURIComponent(userFriendlyMsg)}`
      );
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    // 4. Fetch user profile info from Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error("Failed to fetch user profile from Google:", await userinfoResponse.text());
      return NextResponse.redirect(
        `${origin}/?auth_error=${encodeURIComponent("Google sign-in is temporarily unavailable. Please try again.")}`
      );
    }

    const userInfo: GoogleUserInfo = await userinfoResponse.json();

    if (!userInfo.email) {
      return NextResponse.redirect(
        `${origin}/?auth_error=${encodeURIComponent("No email address associated with this Google account.")}`
      );
    }

    const cleanEmail = userInfo.email.trim().toLowerCase();

    // 5. Find or create user in Prisma database
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { settings: true },
    });

    if (!user) {
      // Auto-generate random secure password hash for OAuth user
      const randomPassword = crypto.randomUUID();
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: userInfo.name || cleanEmail.split("@")[0],
          avatarUrl: userInfo.picture || null,
          passwordHash,
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
        include: { settings: true },
      });
    } else {
      // Update avatar or name if updated on Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userInfo.name || user.name,
          avatarUrl: userInfo.picture || user.avatarUrl,
        },
        include: { settings: true },
      });
    }

    // 6. Generate signed JWT session token
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
    });

    // 7. Store session cookie (7 days, httpOnly, secure in production)
    const response = NextResponse.redirect(`${origin}/?auth_success=true`);

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    response.cookies.delete("oauth_state");

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("Google sign-in is temporarily unavailable. Please try again.")}`
    );
  }
}

export async function GET(req: NextRequest) {
  return handleGoogleOAuthCallback(req);
}

