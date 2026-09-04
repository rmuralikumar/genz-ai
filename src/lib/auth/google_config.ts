import fs from "fs";
import path from "path";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  isConfigured: boolean;
}

/**
 * Server-only helper to load Google OAuth credentials.
 * Checks process.env first, and in development falls back to reading .env / .env.local directly
 * so changes take effect immediately without requiring a dev server restart.
 * NEVER import this file into client-side components.
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  let clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

  // In development only, if process.env is empty or still holds placeholder values, read directly from .env files
  if (
    process.env.NODE_ENV !== "production" &&
    (!clientId ||
      !clientSecret ||
      clientId.includes("your-google-client-id") ||
      clientSecret.includes("your-google-client-secret"))
  ) {
    try {
      const candidates = [
        path.resolve(process.cwd(), ".env.local"),
        path.resolve(process.cwd(), ".env"),
      ];

      for (const envPath of candidates) {
        if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
          const content = fs.readFileSync(/*turbopackIgnore: true*/ envPath, "utf-8");
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const idPrefix = "GOOGLE_CLIENT_ID=";
            const secretPrefix = "GOOGLE_CLIENT_SECRET=";

            if (trimmed.startsWith(idPrefix) && (!clientId || clientId.includes("your-google-client-id"))) {
              const raw = trimmed.substring(idPrefix.length).trim();
              clientId = raw.replace(/^["']|["']$/g, "").trim();
            } else if (trimmed.startsWith(secretPrefix) && (!clientSecret || clientSecret.includes("your-google-client-secret"))) {
              const raw = trimmed.substring(secretPrefix.length).trim();
              clientSecret = raw.replace(/^["']|["']$/g, "").trim();
            }
          }
        }
      }
    } catch (readErr) {
      console.warn("[Google OAuth] Notice: could not read local env file directly:", readErr);
    }
  }

  const isConfigured = Boolean(
    clientId &&
    clientSecret &&
    !clientId.includes("your-google-client-id") &&
    !clientSecret.includes("your-google-client-secret")
  );

  return {
    clientId,
    clientSecret,
    isConfigured,
  };
}

/**
 * Validates whether a requested host is an allowed origin (localhost, configured app URL, or *.vercel.app)
 * to prevent Host Header Poisoning and Open Redirect vulnerabilities in OAuth flows.
 */
function isAllowedHost(hostWithPort: string): boolean {
  if (!hostWithPort) return false;
  const hostname = hostWithPort.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (hostname.endsWith(".vercel.app")) {
    return true;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const configuredHost = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase();
      if (hostname === configuredHost) {
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Resolves the application origin URL securely.
 * Validates request headers against known allowed hosts and falls back
 * safely to NEXT_PUBLIC_APP_URL or http://localhost:3000.
 */
export function resolveAppOrigin(req: Request): string {
  const headers = req.headers;
  const forwardedHost = headers.get("x-forwarded-host");
  const forwardedProto = headers.get("x-forwarded-proto");
  const host = headers.get("host");

  if (forwardedHost && isAllowedHost(forwardedHost)) {
    const proto = forwardedProto || (forwardedHost.startsWith("localhost") ? "http" : "https");
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }

  if (host && isAllowedHost(host)) {
    const proto = forwardedProto || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

