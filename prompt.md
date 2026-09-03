# GENZ-AI — Master Build Prompt

## Project

Build a production-ready AI chat application named **GENZ-AI** from scratch.

GENZ-AI should provide a modern conversational AI experience with a clean interface, responsive layout, chat history, authentication, streaming AI responses, file/image support, settings, model selection, and a scalable backend.

The design may be inspired by modern AI chat applications, but **do not copy ChatGPT/OpenAI branding, logos, proprietary assets, source code, or exact visual design**.

---

# 1. Primary Objective

Create:

**GENZ-AI**

A polished AI assistant web application that works correctly on:

* Mobile phones
* Small phones
* Large phones
* iPhone
* Android
* iPad
* Android tablets
* Laptop
* Desktop
* Large monitors
* Touch screens
* Mouse/keyboard
* Portrait orientation
* Landscape orientation

The UI must remain usable at every viewport size.

---

# 2. Recommended Stack

Use:

* Next.js
* TypeScript
* React
* Tailwind CSS
* shadcn/ui or accessible custom components
* PostgreSQL
* Prisma ORM
* Auth.js or equivalent authentication system
* OpenAI server-side SDK/API
* Zod validation
* React Markdown
* Syntax highlighting for code
* Server-Sent Events or streaming responses
* Object storage for uploaded files
* Redis where appropriate for rate limiting/caching

Use current stable versions.

Do not hard-code outdated package versions unless necessary.

---

# 3. Core Features

Implement:

### Authentication

* Sign up
* Login
* Logout
* Password reset
* OAuth-ready architecture
* Protected chat routes
* User profile
* Account settings

### Chat

* New chat
* Send message
* Receive AI response
* Streaming response
* Stop generation
* Regenerate response
* Edit user message
* Retry response
* Copy response
* Copy code
* Delete message
* Delete conversation
* Rename conversation
* Search conversations
* Chat history
* Auto-scroll
* Scroll-to-bottom button
* Loading state
* Error state
* Empty state

### AI

Create a server-side AI service.

Never expose:

OPENAI_API_KEY

or another secret API key in client-side JavaScript.

The browser communicates with the GENZ-AI backend.

The backend communicates with the AI provider.

---

# 4. UI Structure

Desktop:

---

| GENZ-AI sidebar | Main conversation          |
|                 |                            |
| New Chat        | Header                     |
| Search          |                            |
| Chat history    | Messages                   |
|                 |                            |
|                 |                            |
| User profile    | Composer                   |
------------------------------------------------

Mobile:

---

## | GENZ-AI       ☰ / menu       |

|                              |
|       Conversation           |
|                              |
|                              |
|                              |
--------------------------------

## | Composer                     |

The sidebar must become an overlay/drawer on small screens.

Never allow the desktop sidebar to permanently consume most of a mobile screen.

---

# 5. Responsive Requirements

Use responsive breakpoints.

Suggested behavior:

## < 640px

Mobile mode.

* Sidebar hidden by default
* Drawer opens from menu button
* Full-width conversation
* Compact header
* Composer fixed/sticky near bottom
* Messages have comfortable horizontal padding
* Buttons have touch-friendly targets
* No horizontal page scrolling

## 640px–767px

Large mobile mode.

## 768px–1023px

Tablet mode.

* Collapsible sidebar
* Comfortable message width
* Touch-friendly controls

## 1024px–1279px

Laptop mode.

## 1280px+

Desktop mode.

## Very large screens

Do not allow text to stretch indefinitely.

Use a readable conversation max width.

---

# 6. Mobile Rules

The application must:

* Never overflow horizontally
* Never create accidental horizontal scrolling
* Respect safe-area insets
* Work with mobile browser address bars
* Handle virtual keyboards
* Keep composer usable when keyboard opens
* Support touch scrolling
* Use minimum ~44px touch targets
* Avoid hover-only functionality
* Avoid tiny text
* Avoid fixed elements covering messages
* Support iOS Safari
* Support Android Chrome

Use dynamic viewport units where appropriate.

Do not blindly use:

height: 100vh

for mobile application shells.

Prefer appropriate modern viewport sizing such as:

100dvh

where supported.

---

# 7. Chat Composer

Create a professional composer.

Features:

* Multiline input
* Auto-growing textarea
* Send button
* Stop button while generating
* Attachment button
* Image/file upload
* Enter sends
* Shift+Enter creates newline
* Disabled state
* Loading state
* Character/token awareness where useful

On mobile:

* Composer must remain accessible above the keyboard
* Buttons must not become microscopic
* Textarea must not expand beyond a sensible maximum height

---

# 8. Messages

User message:

* Clear visual distinction
* Accessible contrast
* Text wrapping
* Markdown-safe rendering

Assistant message:

* Markdown
* Headings
* Lists
* Tables
* Blockquotes
* Links
* Inline code
* Code blocks
* Syntax highlighting
* Copy code button

Never render untrusted HTML directly.

Sanitize where necessary.

---

# 9. Code Blocks

Code blocks must include:

* Language label
* Copy button
* Horizontal scrolling for long code
* Syntax highlighting
* Good mobile behavior

Long lines must not break the entire page.

---

# 10. Conversation History

Sidebar contains:

* New Chat
* Search
* Recent conversations
* Older conversations
* Conversation titles
* Context menu

Context menu:

* Rename
* Delete
* Archive if implemented

Do not load thousands of conversations into the DOM.

Use pagination/infinite loading.

---

# 11. Database

Suggested entities:

User

Conversation

Message

Attachment

UsageRecord

ApiKey

Subscription

Feedback

Example relationships:

User
├── Conversations
├── Attachments
├── UsageRecords
└── Subscription

Conversation
└── Messages

Message
└── Attachments

Store:

* IDs
* User ownership
* Message role
* Message content
* Model
* Created timestamp
* Updated timestamp
* Metadata
* Token usage when available

Never store secrets in normal message content.

---

# 12. Authorization

Every conversation query must verify ownership.

A user must NEVER be able to request another user's:

* Conversations
* Messages
* Attachments
* Usage
* API keys
* Account data

Do authorization on the server.

Do not trust IDs received from the browser.

---

# 13. API Design

Create routes such as:

POST /api/chat

GET /api/conversations

POST /api/conversations

GET /api/conversations/:id

PATCH /api/conversations/:id

DELETE /api/conversations/:id

GET /api/conversations/:id/messages

POST /api/upload

GET /api/user

PATCH /api/user

POST /api/feedback

The exact routing convention may follow the chosen Next.js architecture.

Validate all request bodies with Zod.

---

# 14. AI Request Flow

Browser:

User types message.

↓

GENZ-AI frontend

↓

GENZ-AI server

↓

Authenticate user

↓

Validate request

↓

Check rate limit

↓

Check usage/quota

↓

Load conversation

↓

Build AI request

↓

Call AI provider

↓

Stream response

↓

Save final response

↓

Return usage metadata

Never call the AI provider directly from the browser with a secret key.

---

# 15. Streaming

The assistant response should appear progressively.

Required states:

IDLE

SUBMITTING

STREAMING

COMPLETED

ERROR

STOPPED

If the user clicks Stop:

* Abort the request
* Preserve already generated text
* Save appropriate state
* Do not corrupt conversation history

---

# 16. Error Handling

Handle:

* Network failure
* Authentication failure
* Rate limit
* AI provider error
* Timeout
* Invalid request
* Upload failure
* Database failure
* Unknown error

Show friendly messages.

Never expose:

* API keys
* Stack traces
* Database credentials
* Internal service details

to normal users.

---

# 17. Loading States

Use skeletons/spinners only where appropriate.

Avoid unnecessary loading animations.

Chat should feel fast.

Show:

* Sending indicator
* Streaming indicator
* Upload progress
* Page skeleton
* Conversation loading state

---

# 18. Accessibility

Follow WCAG-oriented practices.

Implement:

* Semantic HTML
* Keyboard navigation
* Visible focus
* ARIA labels where needed
* Accessible dialogs
* Accessible menus
* Screen-reader-friendly buttons
* Sufficient contrast
* Reduced-motion support

Users must be able to use the application without a mouse.

---

# 19. Dark Mode

Support:

* Light mode
* Dark mode
* System mode

Persist the preference.

Do not use excessive shadows.

Keep borders subtle.

---

# 20. GENZ-AI Branding

Brand:

GENZ-AI

Use a unique logo/mark.

Do not use OpenAI or ChatGPT logos.

Possible visual direction:

* Modern
* Minimal
* Youthful
* Professional
* AI-focused
* Premium
* Clean

Create reusable brand tokens:

--background

--foreground

--primary

--secondary

--muted

--border

--accent

Do not scatter hard-coded colors throughout components.

---

# 21. Settings

Settings should include:

General

* Theme
* Language
* Default model

Chat

* Enter-to-send
* Auto-scroll
* Compact mode

Privacy

* Data controls

Account

* Profile
* Email
* Password

Usage

* Usage statistics
* Limits

---

# 22. Search

Conversation search should support:

* Title search
* Message search if implemented
* Debounced input
* Empty result state
* Mobile search

Never perform a database query on every keystroke without debounce.

---

# 23. File Upload

Support architecture for:

* Images
* PDF
* Text
* Documents

Validate:

* MIME type
* File extension
* File size

Never trust browser-provided MIME information alone.

Store uploads outside the application server filesystem when appropriate.

Use signed URLs for private files.

---

# 24. Security

Implement:

* Authentication
* Authorization
* CSRF protection where applicable
* Rate limiting
* Input validation
* Output safety
* Secure cookies
* HTTPS in production
* Security headers
* Upload validation
* Prompt-injection-aware architecture
* Server-side secret handling

Never put secrets in:

NEXT_PUBLIC_*

Never commit:

.env

to Git.

Provide:

.env.example

instead.

---

# 25. Environment Variables

Create:

.env.example

Example structure:

DATABASE_URL=

OPENAI_API_KEY=

AUTH_SECRET=

NEXTAUTH_URL=

STORAGE_ENDPOINT=

STORAGE_ACCESS_KEY=

STORAGE_SECRET_KEY=

REDIS_URL=

Do not put real credentials in the repository.

---

# 26. Folder Architecture

Use a maintainable architecture similar to:

app/
page.tsx
chat/
settings/
api/
chat/
conversations/
upload/
user/
feedback/

components/
chat/
sidebar/
composer/
messages/
settings/
ui/

lib/
ai/
auth/
db/
storage/
validation/
rate-limit/

prisma/
schema.prisma

hooks/

types/

public/

tests/

---

# 27. Components

Create reusable components:

AppShell

Sidebar

MobileSidebar

ChatHeader

ConversationList

ConversationItem

ChatWindow

MessageList

Message

AssistantMessage

UserMessage

CodeBlock

Composer

AttachmentButton

FilePreview

ModelSelector

StopButton

EmptyChat

LoadingMessage

ErrorMessage

SettingsDialog

UserMenu

SearchDialog

ConfirmDialog

Do not create giant components.

Split functionality logically.

---

# 28. Performance

Optimize:

* Initial bundle
* Images
* Fonts
* Database queries
* Conversation loading
* Streaming
* React rendering
* Client state

Do not rerender the entire conversation on every token if avoidable.

Use memoization carefully.

Virtualize very large message lists if necessary.

---

# 29. SEO

Create:

* Metadata
* Favicon
* Open Graph metadata
* Twitter/X metadata
* robots.txt
* sitemap where appropriate

Brand title:

GENZ-AI — Your AI Assistant

---

# 30. PWA

If appropriate, support:

* Installable web app
* App icon
* Manifest
* Mobile-friendly experience

Do not compromise normal browser functionality.

---

# 31. Testing

Write tests for:

Authentication

Authorization

Chat API

Message persistence

Conversation ownership

Rate limiting

Validation

Upload validation

Critical UI interactions

Responsive behavior

Test at:

375px

390px

430px

768px

820px

1024px

1280px

1440px

1920px

---

# 32. Browser Testing

Verify:

Chrome

Safari

Firefox

Edge

iOS Safari

Android Chrome

Test:

* Portrait
* Landscape
* Keyboard open
* Long messages
* Long code
* Long conversation
* Offline/network failure
* Slow connection

---

# 33. No Horizontal Overflow

This is mandatory.

Check:

document.documentElement.scrollWidth

against:

window.innerWidth

No unexpected overflow should exist.

Long:

* URLs
* code
* words
* filenames
* markdown tables

must not break the layout.

---

# 34. Deployment

Prepare production deployment.

Recommended architecture:

Frontend/backend:
Next.js deployment

Database:
Managed PostgreSQL

Storage:
Private object storage

Caching/rate limiting:
Redis-compatible service

Secrets:
Deployment-provider secret manager

Never require users to manually configure server credentials in browser code.

---

# 35. Developer Experience

Include:

README.md

PROMPT.md

AGENT.md

.env.example

package.json

database schema

migration instructions

development commands

production commands

testing commands

lint commands

build commands

---

# 36. Required Commands

Document:

npm install

npm run dev

npm run lint

npm run test

npm run build

npm run start

Database commands appropriate to the selected ORM.

---

# 37. Visual Quality

The final UI should feel:

* Premium
* Calm
* Modern
* Fast
* Clean
* Consistent

Avoid:

* Excessive gradients
* Giant decorative elements
* Tiny buttons
* Clutter
* Excessive animations
* Random colors
* Poor contrast
* Fixed desktop-only dimensions

---

# 38. Final Acceptance Criteria

The project is NOT complete until:

1. User can register.
2. User can log in.
3. User can start a new chat.
4. User can send a message.
5. AI response streams.
6. Conversation persists.
7. History persists.
8. User can rename a conversation.
9. User can delete a conversation.
10. User can stop generation.
11. User can regenerate a response.
12. Markdown works.
13. Code blocks work.
14. Copy buttons work.
15. Mobile layout works.
16. Tablet layout works.
17. Laptop layout works.
18. Desktop layout works.
19. Dark mode works.
20. Settings work.
21. Unauthorized users cannot access private conversations.
22. Secrets never reach the browser.
23. No accidental horizontal scrolling exists.
24. Production build succeeds.
25. Tests pass.

---

# 39. Agent Behavior

When implementing this project:

DO NOT stop after creating the UI.

Build the complete application.

When a feature depends on another feature, implement the dependency first.

Do not use fake API responses once the real backend is available.

Do not leave TODO placeholders for core functionality.

If a package is unnecessary, do not install it.

If an implementation choice is ambiguous, choose the simplest production-safe approach.

Prioritize correctness, security, accessibility, responsiveness, and maintainability.

---

# 40. Final Instruction

Build GENZ-AI from an empty repository into a complete production-ready AI chat application.

Do not copy proprietary ChatGPT source code.

Do not copy OpenAI branding.

Use the product name:

GENZ-AI

The result must be responsive across mobile, tablet, laptop, desktop, and large screens.

Do not declare the project finished until the acceptance criteria have been verified.
