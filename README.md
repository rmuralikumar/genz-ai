# GENZ-AI

> An intelligent, full-stack conversational AI platform featuring progressive streaming chat, autonomous multimodal tool execution, zero-flash adaptive themes, and multi-provider media generation.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2d3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169e1?logo=postgresql)](https://neon.tech/)

---

## Overview

**GENZ-AI** is a modern, production-grade conversational AI application built with Next.js (App Router), React 19, Prisma, and Tailwind CSS. Designed with a sleek, ChatGPT-style responsive interface, GENZ-AI seamlessly bridges conversational reasoning with an autonomous tool execution registry capable of real-time web search, visual image synthesis, document and image inspection, arithmetic execution, speech recognition, and multi-tier video generation.

---

## Features

- 💬 **Streaming AI Conversations**: Smooth, token-by-token streaming powered by Server-Sent Events (SSE) with live typing pacing and auto-scrolling.
- 🌓 **Zero-Flash Theme Architecture**: Dark, Light, and System modes with a synchronous pre-render blocking script ensuring zero light-mode flash on refresh, persistent across `localStorage` and cloud settings.
- 🔍 **Interactive Conversation Search (Ctrl+K / Cmd+K)**: Instant fuzzy search modal to filter, search, and jump across conversation histories.
- 📱 **Adaptive ChatGPT-Style Sidebar**: Collapsible desktop sidebar with icon rail mode and a touch-optimized mobile drawer overlay.
- 🔐 **Authentication & Security**: Google OAuth 2.0 integration and email/password authentication with secure HTTP-only session cookies and Bcrypt hashing.
- 🗄️ **Persistent Chat History**: Cloud storage powered by Neon PostgreSQL and Prisma ORM, including conversation search, inline renaming, archiving, and deletion.
- 🎨 **Generative AI Image Studio**: High-resolution image generation powered by FLUX (via Pollinations AI, zero API keys required) with optional OpenAI DALL-E 3 fallback.
- 📸 **Multi-Source Photo Search**: Real-world image search aggregating Wikipedia, Wikimedia Commons, and Unsplash.
- 🌐 **Live Web Search**: Autonomous real-time web search with an interactive sources drawer and multi-turn synthesized answers.
- 🔬 **Deep Research**: In-depth analytical mode for exploring complex technical, historical, and architectural queries.
- 🧮 **Accurate Calculator & Math**: Direct server-side mathematical expression evaluation for deterministic calculations.
- 📄 **Multimodal Document Processing**: Upload and analyze PDFs, Word documents (`.docx`), Excel spreadsheets (`.xlsx`), CSVs, code files, and plain text.
- 👁️ **Vision & Image Understanding**: Inspect, describe, and extract insights from uploaded image attachments.
- 🎙️ **Voice Input & Transcription**: Voice recording and automated speech-to-text transcription.
- 🔊 **Text-to-Speech (TTS)**: Built-in natural audio synthesis for listening to assistant responses.
- 🎬 **AI Video Studio**: Flexible multi-provider video architecture with a zero-cost default storyboard generator, local GPU support, and optional cloud rendering.
- 🔔 **Interactive Toast Feedback**: Contextual toast notifications for user actions and graceful notices for upcoming features.

---

## Zero-Flash Theme Architecture

GENZ-AI implements a zero-flash theme persistence strategy designed to eliminate FOUC (Flash of Unstyled Content) during SSR hydration:

1. **Pre-Paint Blocking Script**: An inline script in `<head>` runs before DOM elements or CSS are painted by the browser engine. It immediately checks `localStorage.getItem('genz_theme')` or system `prefers-color-scheme`, synchronizing `data-theme` and `.dark`/`.light` classes onto `document.documentElement`.
2. **Hydration Mismatch Prevention**: The root `<html>` tag leverages `suppressHydrationWarning` to ensure smooth client reconciliation without hydration warnings.
3. **Tailwind CSS v4 Strategy**: Configured via `@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));` ensuring synchronized CSS styling across all components.
4. **Cloud & Local Synchronization**: The client uses `localStorage` as the immediate source of truth to avoid latency flashes while seamlessly saving changes back to the PostgreSQL database in the background.

---

## AI Tool Architecture

GENZ-AI operates on an autonomous **Intent Detection and Tool Registry Engine** (`src/lib/ai/tools/registry.ts`).

```
User Message
     │
     ▼
┌──────────────────────────────────────────────┐
│  Intent Router & ReAct Heuristic Parser     │
│  (Detects video, search, images, files, etc) │
└──────────────────────────────────────────────┘
     │
     ├──────────────────────┬──────────────────────┬──────────────────────┐
     ▼                      ▼                      ▼                      ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ web_search  │       │image_gener- │       │video_gener- │       │ calculator  │
│             │       │ation        │       │ation        │       │             │
└─────────────┘       └─────────────┘       └─────────────┘       └─────────────┘
     │                      │                      │                      │
     └──────────────────────┴──────────────────────┴──────────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ Server-Sent Events Stream    │
                     │ (Sanitized Markdown / Media) │
                     └──────────────────────────────┘
```

### Supported Tools

| Tool | Trigger / Intent | Description |
| :--- | :--- | :--- |
| `web_search` | Real-time queries, current events, facts | Fetches verified web sources and synthesizes answers |
| `image_generation` | "generate an image of...", "draw...", "FLUX" | Generates photorealistic images using FLUX or DALL-E 3 |
| `image_search` | "photo of...", "picture of [subject]" | Searches Wikipedia, Commons, and Unsplash for real photos |
| `video_generation` | "generate a video of...", "create clip" | Dispatches to the multi-provider video generation engine |
| `calculator` | Arithmetic, formulas, equations | Evaluates math deterministically |
| `file_analysis` | File uploads (`.pdf`, `.docx`, `.xlsx`, `.txt`) | Extracts text and generates document summaries |
| `vision` | Image uploads with question | Multimodal image understanding and visual QA |
| `text_to_speech` | Audio playback requests | Generates browser-playable spoken audio |

> [!NOTE]
> **Safety Guarantee**: The engine strictly intercepts and executes tool calls server-side. Raw ReAct action JSON (e.g. `{"action": "..."}`) is never exposed directly to the user.

---

## Video Generation

GENZ-AI implements a resilient multi-provider video pipeline (`src/lib/ai/video.ts`) designed to eliminate mandatory paid dependencies while maintaining strict honesty regarding compute constraints.

```
                           video_generation request
                                     │
                                     ▼
                  ┌──────────────────────────────────────┐
                  │ 1. Local / Self-Hosted GPU Endpoint? │
                  │    (VIDEO_API_URL / LOCAL_VIDEO_URL) │
                  └──────────────────────────────────────┘
                                ├───────── Yes ──► Direct Rendering
                                ▼ No
                  ┌──────────────────────────────────────┐
                  │ 2. Hugging Face Inference Configured?│
                  │    (HUGGINGFACE_API_KEY / HF_TOKEN)  │
                  └──────────────────────────────────────┘
                                ├───────── Yes ──► Hugging Face API
                                ▼ No
                  ┌──────────────────────────────────────┐
                  │ 3. Optional Replicate Configured?    │
                  │    (REPLICATE_API_TOKEN)             │
                  └──────────────────────────────────────┘
                                ├───────── Yes ──► Replicate AnimateDiff
                                ▼ No
                  ┌──────────────────────────────────────┐
                  │ 4. Default: Free AI Video Studio     │
                  │    (Zero-Cost FLUX Keyframe & Spec)  │
                  └──────────────────────────────────────┘
```

### Provider Behavior Matrix

| Provider | Authentication | Cost | Output Behavior |
| :--- | :--- | :--- | :--- |
| **Free AI Video Studio** *(Default)* | None required | **100% Free** | Generates a cinematic visual keyframe via FLUX, motion/camera specifications, and 1-click links to top free video tools. |
| **Hugging Face** | `HUGGINGFACE_API_KEY` | Free tier | Programmatic text-to-video inference when available. |
| **Local / Self-Hosted GPU** | `VIDEO_API_URL` | Free (Own hardware) | Direct MP4 rendering via self-hosted ComfyUI or FastAPI servers. |
| **Replicate** | `REPLICATE_API_TOKEN` | Paid / Credits | Cloud GPU rendering using AnimateDiff. Reports credit status gracefully if exhausted. |

### Integrity & Compute Reality
- **No Faked Generation**: If a provider cannot render an actual video file (e.g. within serverless constraints), the assistant returns structured scene specifications and keyframe previews. It **never claims an MP4 was generated** when only a storyboard was created.
- **Vercel Serverless Reality**: Full text-to-video diffusion models require high-memory GPUs (16GB+ VRAM) and multiple minutes of inference time. Because Vercel functions run in CPU-only containers with short timeouts, serverless rendering requires external GPU compute endpoints.

---

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Frontend Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/)
- **ORM**: [Prisma ORM 6](https://www.prisma.io/)
- **AI Backend**: [Ollama Cloud](https://ollama.com/) / Local Ollama
- **Authentication**: Google OAuth 2.0 & Jose JWT sessions
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Version Control**: [GitHub](https://github.com/)

---

## Environment Variables

Create a `.env` file in the project root. You can use `.env.example` as a starting template:

```bash
cp .env.example .env
```

### Configuration Reference

```env
# ==========================================
# 1. Database (REQUIRED)
# ==========================================
# Neon Serverless PostgreSQL connection string:
DATABASE_URL="postgresql://username:password@ep-sample-pooler.region.neon.tech/genz_ai?sslmode=require"

# ==========================================
# 2. Authentication (REQUIRED)
# ==========================================
# Secret used for signing JWT tokens (generate with: openssl rand -base64 32)
AUTH_SECRET="YOUR_SECURE_32_CHARACTER_JWT_SECRET"

# Google OAuth 2.0 (Obtain from Google Cloud Console)
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# ==========================================
# 3. AI Service — Ollama (REQUIRED)
# ==========================================
# For Ollama Cloud:
OLLAMA_BASE_URL="https://ollama.com"
OLLAMA_MODEL="gemma3:4b"
OLLAMA_API_KEY="YOUR_OLLAMA_API_KEY"

# For Local Ollama (alternative):
# OLLAMA_BASE_URL="http://localhost:11434"
# OLLAMA_MODEL="gemma3:4b"
# OLLAMA_API_KEY=""

# ==========================================
# 4. Video Generation Providers (OPTIONAL)
# ==========================================
# Default: Free AI Video Studio operates automatically with zero configuration.
# Connect a local or self-hosted GPU video server (e.g. ComfyUI, FastAPI):
VIDEO_API_URL=""
# Optional Free Hugging Face Inference Token:
HUGGINGFACE_API_KEY=""
# Optional Replicate API Token (paid fallback):
REPLICATE_API_TOKEN=""

# ==========================================
# 5. Optional Media & Search Providers
# ==========================================
# Optional OpenAI API Key (for DALL-E 3; defaults to zero-cost FLUX if omitted):
OPENAI_API_KEY=""
# Optional Unsplash Access Key (falls back to Wikimedia/Wikipedia if omitted):
UNSPLASH_ACCESS_KEY=""
# Optional Google Custom Search:
GOOGLE_SEARCH_API_KEY=""
GOOGLE_SEARCH_ENGINE_ID=""

# ==========================================
# 6. Application Configuration
# ==========================================
NEXT_PUBLIC_APP_NAME="GENZ-AI"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Variable | Required? | Default / Fallback | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | — | PostgreSQL / Neon connection string |
| `AUTH_SECRET` | **Yes** | — | Session signing key |
| `GOOGLE_CLIENT_ID` | Optional | — | Enables Google Single Sign-On |
| `GOOGLE_CLIENT_SECRET` | Optional | — | Google OAuth client secret |
| `OLLAMA_BASE_URL` | **Yes** | `https://ollama.com` | Base URL for LLM provider |
| `OLLAMA_MODEL` | **Yes** | `gemma3:4b` | Default LLM model identifier |
| `OLLAMA_API_KEY` | Optional | — | API key for Ollama Cloud |
| `VIDEO_API_URL` | Optional | — | Self-hosted GPU video endpoint |
| `HUGGINGFACE_API_KEY` | Optional | — | Hugging Face inference token |
| `REPLICATE_API_TOKEN` | Optional | — | Optional Replicate rendering token |
| `OPENAI_API_KEY` | Optional | — | DALL-E 3 (FLUX used by default) |
| `UNSPLASH_ACCESS_KEY` | Optional | — | Unsplash photography search |
| `NEXT_PUBLIC_APP_URL` | Optional | `http://localhost:3000` | Canonical app URL for OAuth redirects |

---

## Local Development

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- **npm**: v9+
- A running PostgreSQL database (e.g. [Neon](https://neon.tech/))

### 2. Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/rmuralikumar/genz-ai.git
cd genz-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Generate Prisma Client
npx prisma generate

# 5. Synchronize Database Schema
npx prisma db push

# 6. Launch the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google OAuth Setup

To enable Google Single Sign-On:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** > **Credentials**.
3. Click **Create Credentials** > **OAuth client ID**.
4. Select **Web application** as the Application Type.
5. Configure the URIs:
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (Local development)
     - `https://your-domain.vercel.app` (Production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/api/auth/callback`
     - `https://your-domain.vercel.app/auth/callback`
     - `https://your-domain.vercel.app/api/auth/callback`
6. Copy the **Client ID** and **Client Secret** into your `.env` file:
   ```env
   GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   ```

---

## Database Management

GENZ-AI uses **Prisma ORM** connected to a PostgreSQL database (optimized for Neon serverless):

```bash
# Generate type-safe Prisma client
npx prisma generate

# Push schema changes directly to Neon PostgreSQL
npx prisma db push

# Launch interactive Prisma Studio GUI to inspect tables and records
npx prisma studio
```

### Database Schema Highlights
- **`users`**: User profiles, password hashes, avatar metadata, timestamps.
- **`conversations`**: Chat thread metadata, model configurations, archive flags.
- **`messages`**: Multi-turn history, roles (`user`, `assistant`, `system`), token metrics.
- **`attachments`**: Media attachments (images, PDFs, documents, MP4 video records).
- **`user_settings`**: Theme preferences (`dark`, `light`, `system`), UI density, auto-scroll states.

---

## Production Deployment

GENZ-AI is optimized for deployment on **Vercel** with GitHub integration.

### Deployment Process

1. **Push your code to GitHub**:
   ```bash
   git push origin main
   ```
2. **Import project into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your `genz-ai` repository.
3. **Configure Environment Variables in Vercel**:
   - In the project settings, add the required environment variables:
     - `DATABASE_URL`
     - `AUTH_SECRET`
     - `OLLAMA_BASE_URL`
     - `OLLAMA_MODEL`
     - `OLLAMA_API_KEY`
     - `GOOGLE_CLIENT_ID` (if using Google OAuth)
     - `GOOGLE_CLIENT_SECRET` (if using Google OAuth)
     - `NEXT_PUBLIC_APP_URL` (set to `https://your-app.vercel.app`)
     - Any optional provider keys (`VIDEO_API_URL`, `REPLICATE_API_TOKEN`, etc.)
4. **Deploy**:
   - Every push to the `main` branch automatically triggers a production build and deployment.

---

## Security Best Practices

- 🔒 **Never commit `.env` files**: Keep `.env` and `.env.local` strictly in `.gitignore`.
- 🔑 **Frontend Secret Isolation**: Never prefix private API keys with `NEXT_PUBLIC_`. Secrets are consumed strictly within server-side API routes and server actions.
- 🍪 **HTTP-Only Cookies**: Authentication session tokens are stored in secure, `SameSite=Lax`, `HttpOnly` cookies to protect against XSS attacks.
- 🛡️ **Host Header Poisoning Protection**: OAuth callbacks validate host headers against allowed domain patterns (`localhost`, `*.vercel.app`, and configured app URL).
- 🔄 **Credential Rotation**: If any credential or key is accidentally exposed, immediately revoke and rotate it in your provider dashboard.

---

## Testing & Verification

Run project checks before committing changes:

```bash
# 1. Run TypeScript static type inspection
npx tsc --noEmit

# 2. Compile Next.js production build
npm run build

# 3. Run linter
npm run lint
```

---

## Project Structure

```text
genz-ai/
├── prisma/
│   └── schema.prisma              # Prisma schema definitions
├── public/                        # Static assets and icons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # Google OAuth, credentials, session routes
│   │   │   ├── chat/              # Main streaming chat SSE handler
│   │   │   ├── conversations/     # Conversation CRUD operations
│   │   │   ├── upload/            # File attachment uploader
│   │   │   ├── user/settings/     # User preferences & theme persistence
│   │   │   └── voice/             # Speech transcription handler
│   │   ├── auth/callback/         # Client-side OAuth callback redirect
│   │   ├── globals.css            # Tailwind CSS & design tokens
│   │   ├── layout.tsx             # Root layout with zero-flash theme head script
│   │   └── page.tsx               # Main chat application page
│   ├── components/
│   │   ├── auth/                  # Authentication modals & sign-in buttons
│   │   ├── chat/                  # ChatArea, MessageItem, ModelSelector, Composer
│   │   ├── layout/                # AppShell container & state coordinator
│   │   ├── search/                # SearchPanel conversation search modal (Ctrl+K)
│   │   ├── settings/              # SettingsModal & preferences
│   │   ├── sidebar/               # Collapsible desktop Sidebar & MobileSidebar
│   │   └── ui/                    # Toast and reusable interactive controls
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── tools/
│   │   │   │   ├── parser.ts      # ReAct and function call parsers
│   │   │   │   └── registry.ts    # Central AI tool registry
│   │   │   ├── image.ts           # FLUX / DALL-E & photo search engine
│   │   │   ├── intent_router.ts   # Natural language intent detection
│   │   │   ├── models.ts          # Supported model configurations
│   │   │   ├── stream.ts          # SSE token streaming & tool coordinator
│   │   │   ├── video.ts           # Multi-provider AI video generation engine
│   │   │   └── web_search.ts      # Web search execution & source parser
│   │   ├── auth/                  # JWT session and Google OAuth utilities
│   │   ├── db/                    # Prisma database client singleton
│   │   └── theme.ts               # Zero-flash theme manager (dark/light/system)
│   └── types/                     # TypeScript type declarations
├── .env.example                   # Environment configuration template
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript compiler options
```

---

## Troubleshooting

### 1. Google OAuth `invalid_client` or Redirect Mismatch
- **Cause**: The redirect URI in the Google Cloud Console does not match the URI being generated by the application.
- **Solution**: Ensure `https://your-domain.vercel.app/auth/callback` and `http://localhost:3000/auth/callback` are added to **Authorized Redirect URIs** in Google Cloud Console, and that `NEXT_PUBLIC_APP_URL` matches your actual domain.

### 2. Database / Prisma Connection Errors
- **Cause**: Incorrect database connection string, expired credentials, or missing SSL configuration.
- **Solution**: Verify `DATABASE_URL` in `.env`. For Neon, ensure `?sslmode=require` is appended. Run `npx prisma db push` to verify database reachability.

### 3. Theme Flash on Page Reload
- **Cause**: Client theme was initialized only inside `useEffect()`, causing light mode to briefly paint before JavaScript runs.
- **Solution**: GENZ-AI includes an inline blocking `<script>` in `<head>` inside [src/app/layout.tsx](file:///c:/murali/projects/genz-ai/src/app/layout.tsx) which reads `localStorage` and applies the theme class immediately before any DOM rendering.

### 4. Ollama Authentication or Model Errors
- **Cause**: Invalid `OLLAMA_API_KEY` for Ollama Cloud, or the requested model is not accessible.
- **Solution**: Verify your API key at [ollama.com](https://ollama.com). If using local Ollama, ensure Ollama is running (`ollama serve`) and the model is pulled (`ollama pull gemma3:4b`).

### 5. Video Provider Limits or Inactive Credits
- **Cause**: Configured provider (e.g. Replicate) returned HTTP 402 (payment required) or rate limits.
- **Solution**: The application automatically falls back to the **Free AI Video Studio** without interrupting chat. If you want direct MP4 rendering, verify credits in your Replicate dashboard or configure a self-hosted `VIDEO_API_URL`.

### 6. Vercel Environment Variables Not Active
- **Cause**: Environment variables were added in Vercel after the build, or redeployment was not triggered.
- **Solution**: In Vercel Project Settings > Environment Variables, verify values for both **Preview** and **Production** environments, then trigger a redeploy.

---

## License

MIT License. See [LICENSE](LICENSE) for details.