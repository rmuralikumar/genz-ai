# Google OAuth 2.0 Production Setup Guide for GENZ-AI

This document provides a comprehensive, step-by-step walkthrough for configuring Google OAuth 2.0 authentication for **GENZ-AI** across both local development and production deployments.

---

## 1. Google Cloud Project Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top navigation bar and click **New Project** (or choose an existing project).
3. Name your project (e.g., `genz-ai-assistant`) and click **Create**.

---

## 2. Configure OAuth Consent Screen

1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen** (or **Google Auth Platform**).
2. Under **User Type**, select **External** and click **Create**.
3. Fill in the required application details:
   - **App name**: `GENZ-AI`
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload the GENZ-AI logo from `public/logo.png`
   - **Application home page**: `https://genzai-web.vercel.app`
   - **Authorized domains**:
     - `vercel.app`
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Update** and then **Save and Continue**.
7. If your app status is in **Testing**, add the Google accounts you intend to use for testing under **Test Users**.
8. Once ready for all users, click **Publish App** to make it accessible to any Google account.

---

## 3. Create OAuth 2.0 Client Credentials

1. In the left menu, navigate to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. In the **Application type** dropdown, select **Web application**.
4. Set **Name** to: `GENZ-AI Web Client`.

### 4. Authorized JavaScript Origins
Add both your local development origin and production domain:
- `http://localhost:3000`
- `https://genzai-web.vercel.app`

*(Note: Do not add a trailing slash to origin URLs).*

### 5. Authorized Redirect URIs
Add the exact callback paths supported by GENZ-AI:

#### Local Development:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/api/auth/callback`

#### Production (Vercel):
- `https://genzai-web.vercel.app/auth/callback`
- `https://genzai-web.vercel.app/api/auth/callback`

> **Important**: Google Cloud requires an exact match for redirect URIs. Ensure there are no trailing slashes on these paths.

6. Click **Create**.
7. A dialog will appear showing your **Client ID** and **Client Secret**.

---

## 4. Local Environment Configuration

1. In your local project root, open or create `.env`:
   ```env
   # Google OAuth 2.0 Credentials (server-side only)
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"

   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   AUTH_SECRET="your-secure-random-32-character-secret"
   ```

2. **Restart your development server** if it was previously running so that the Node.js process reloads environment variables:
   ```bash
   npm run dev
   ```

---

## 5. Production Deployment Configuration (Vercel)

Add the corresponding environment variables in your Vercel Dashboard:

1. Go to your project on [Vercel Dashboard](https://vercel.com).
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following variables for **Production** (and **Preview** if applicable):

| Variable Name | Description | Example |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `2045...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-...` |
| `NEXT_PUBLIC_APP_URL` | Production application base URL | `https://genzai-web.vercel.app` |
| `AUTH_SECRET` | Secret key used for signing JWT cookies | 32+ character random string |
| `DATABASE_URL` | Production PostgreSQL connection URL | `postgresql://...` |

4. Trigger a redeployment on Vercel to apply the updated environment variables.

---

## 6. Security Architecture Verification

- **Server-Side Only**: `GOOGLE_CLIENT_SECRET` is strictly kept on the server and is never prefixed with `NEXT_PUBLIC_` or included in browser bundles.
- **CSRF Protection**: A cryptographically random `oauth_state` cookie (`httpOnly`, `sameSite: lax`) is generated during authorization and validated upon callback.
- **JWT Session**: Authenticated users receive a signed 7-day `genz_session` HTTP-only cookie.
- **Profile Synchronization**: The user's name, email, and Google avatar image are automatically synchronized with the database record upon login.
