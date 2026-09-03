# GENZ-AI — Your Modern AI Assistant

**GENZ-AI** is a production-grade conversational AI web application engineered for speed, reasoning, and a responsive experience across mobile, tablet, laptop, and desktop displays.

---

## Features

- **Streaming AI Conversations**: Progressive token-by-token streaming using Server-Sent Events (SSE) with support for live OpenAI API (`gpt-4o`, `gpt-4o-mini`, `o1`) or high-fidelity simulated streaming mode when no external API key is supplied.
- **Model Selection**: Switch seamlessly between:
  - **GENZ Fast**: Lightning quick responses for everyday questions.
  - **GENZ Reasoning**: Deep logic, math, and code architecture.
  - **GENZ Creative**: Expansive ideation, writing, and design synthesis.
- **Rich Markdown & Syntax Highlighting**:
  - Safe Markdown parsing with tables, lists, quotes, and links.
  - Code blocks with language badges, horizontal scroll preservation, and one-click copy buttons.
- **Conversation Management**:
  - Automatic intelligent conversation naming based on initial user prompt.
  - Categorized sidebar history (Today, Previous 7 Days, Older).
  - Inline conversation renaming and deletion with confirmation.
  - Real-time debounced search across conversation titles and messages.
- **Composer & Controls**:
  - Auto-resizing multiline textarea.
  - Enter to send, Shift+Enter for newlines.
  - Stop generation mid-stream with partial response preservation.
  - Regenerate AI response and edit user messages.
  - Multi-format file attachment uploader (images, PDF, code snippets, text files).
- **Responsive & Touch-Friendly**:
  - Full support for Mobile (375px+), Tablet (768px+), Laptop (1024px+), and Ultrawide displays.
  - Mobile slide-in drawer with backdrop tap dismiss and ESC navigation.
  - Pinned bottom composer respecting mobile safe areas (`100dvh`).
  - Zero accidental horizontal scrolling (`overflow-x: hidden`).
- **Authentication & Security**:
  - Secure session management with HTTP-only, SameSite cookies.
  - Bcrypt password hashing.
  - Strict server-side user ownership isolation on all queries (`WHERE id = ? AND userId = ?`).
  - Secret API keys never exposed to client-side bundles.
- **Custom Settings & Appearance**:
  - Theme switching: Dark (default), Light, or System preference.
  - Configurable chat controls (Enter-to-send, auto-scroll, compact mode).
  - Profile customization and real-time usage token counters.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite (local zero-setup) and PostgreSQL readiness
- **Icons**: [Lucide React](https://lucide.dev/)
- **Auth**: Jose JWT & Bcryptjs
- **Validation**: Zod
- **Markdown**: React-Markdown & Remark-GFM

---

## Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm

### 2. Environment Setup
Copy the template configuration:
```bash
cp .env.example .env
```

Configure environment variables in `.env`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secure-32-character-secret-key"
OPENAI_API_KEY="" # Optional: Add your OpenAI API key for live generation
NEXT_PUBLIC_APP_NAME="GENZ-AI"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Initialization
Generate the Prisma Client and sync the database schema:
```bash
npm run db:push
```

### 4. Development Server
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied) in your browser.

---

## Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js dev server |
| `npm run build` | Generates Prisma client and compiles production build |
| `npm run start` | Launches production server |
| `npm run lint` | Runs ESLint validation |
| `npm run db:push` | Synchronizes Prisma schema with database |
| `npm run db:generate` | Regenerates Prisma Client types |
| `npm run db:studio` | Launches Prisma Studio GUI for exploring database records |

---

## Production Deployment

1. Set `DATABASE_URL` to your managed PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/genz_ai?schema=public"
   ```
2. In `prisma/schema.prisma`, update provider to `postgresql`.
3. Set `AUTH_SECRET` to a secure random string (`openssl rand -base64 32`).
4. Set `OPENAI_API_KEY` with your production API key.
5. Run `npm run build` and `npm run start`.