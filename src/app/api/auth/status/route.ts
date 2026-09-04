import { NextResponse } from "next/server";
import { getGoogleOAuthConfig, resolveAppOrigin } from "@/lib/auth/google_config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { clientId, clientSecret, isConfigured } = getGoogleOAuthConfig();
  const origin = resolveAppOrigin(req);

  return NextResponse.json({
    status: "ok",
    googleOAuth: {
      isConfigured,
      clientIdConfigured: Boolean(clientId && !clientId.includes("your-google-client-id")),
      clientSecretConfigured: Boolean(clientSecret && !clientSecret.includes("your-google-client-secret")),
    },
    appOrigin: origin,
    redirectUri: `${origin}/auth/callback`,
    timestamp: new Date().toISOString(),
  });
}
