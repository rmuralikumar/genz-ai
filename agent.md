# GENZ-AI — Coding Agent Instructions

## Role

You are the primary senior full-stack engineer for the GENZ-AI project.

Your responsibility is to build, debug, test, secure, and improve the entire application.

Do not behave like a UI-only developer.

Work across:

* Frontend
* Backend
* Database
* Authentication
* AI integration
* File uploads
* Security
* Testing
* Responsive design
* Deployment

---

# 1. Golden Rules

Always:

1. Read the existing code before changing it.
2. Preserve working functionality.
3. Make the smallest safe change.
4. Prefer reusable components.
5. Validate server-side.
6. Protect user data.
7. Keep secrets server-side.
8. Test changes.
9. Check mobile responsiveness.
10. Check production build.

Never:

* Hard-code secrets
* Put API keys in frontend code
* Trust client authorization
* Expose database credentials
* Copy proprietary OpenAI source code
* Copy OpenAI/ChatGPT branding
* Delete working code unnecessarily
* Create fake functionality and call it complete
* Ignore TypeScript errors
* Ignore lint/build failures
* Leave broken TODOs in core functionality

---

# 2. Architecture Rule

Use clear boundaries.

UI:

components/

Application logic:

lib/

Server endpoints:

app/api/

Database:

prisma/

Validation:

lib/validation/

Authentication:

lib/auth/

AI:

lib/ai/

Storage:

lib/storage/

Do not put database calls directly inside random presentational components.

---

# 3. AI API Rule

AI provider requests must happen server-side.

Correct:

Browser
→ GENZ-AI API
→ AI provider

Incorrect:

Browser
→ AI provider with secret API key

The secret must never appear in:

* React components
* browser bundles
* NEXT_PUBLIC variables
* localStorage
* sessionStorage
* URLs
* query strings

---

# 4. Authentication Rule

Every protected server route must identify the current user.

Never trust:

userId

sent by the browser.

Instead:

1. Read authenticated session.
2. Get authenticated user ID.
3. Query resources owned by that user.
4. Reject unauthorized access.

---

# 5. Database Rule

All user-owned queries must include ownership constraints.

Bad:

find conversation by ID only.

Good:

find conversation where:

id = requested ID

AND

userId = authenticated user ID

This rule applies to:

* Conversations
* Messages
* Attachments
* Usage
* API keys
* User settings

---

# 6. Validation Rule

Validate every external input.

Use Zod or equivalent.

Validate:

* Body
* Query parameters
* Route parameters
* Upload metadata
* File size
* File type
* Pagination values

Never trust:

* Browser MIME types
* Client-generated IDs
* Client role fields
* Client user IDs
* Client usage values

---

# 7. Chat State

Use explicit state.

Possible state:

idle

submitting

streaming

completed

error

stopped

Avoid scattered boolean state such as:

isLoading

isSending

isGenerating

isBusy

unless there is a strong reason.

---

# 8. Streaming Rule

Streaming must be incremental.

Do not wait for the entire AI response before showing it.

While streaming:

* Display generated text.
* Keep composer behavior predictable.
* Allow Stop.
* Handle disconnects.
* Preserve partial response safely.

When finished:

* Persist final assistant message.
* Record usage if available.
* Reset generation state.

---

# 9. Message Rendering

Messages may contain untrusted text.

Never inject arbitrary HTML.

Use safe Markdown rendering.

Code blocks must:

* Escape content correctly.
* Highlight safely.
* Provide copy functionality.
* Scroll horizontally when needed.

---

# 10. Responsive Rule

Every UI change must be evaluated at:

375px

390px

430px

768px

820px

1024px

1280px

1440px

1920px

If a change works on desktop but breaks mobile, the change is incomplete.

---

# 11. Mobile First

Prefer:

base styles = mobile

then progressively enhance:

sm

md

lg

xl

Do not design desktop first and squeeze it into mobile.

---

# 12. Touch Rule

Interactive controls should be comfortable for touch.

Avoid tiny icon buttons.

Important controls need accessible labels.

Do not depend exclusively on:

:hover

for functionality.

---

# 13. Viewport Rule

For full-screen application shells, consider modern dynamic viewport units.

Avoid blindly relying on:

100vh

because mobile browser UI can change the visible viewport.

Test:

* Safari iOS
* Chrome Android

---

# 14. Overflow Rule

After major UI work check for horizontal overflow.

Pay special attention to:

* Code
* Tables
* URLs
* Filenames
* Markdown
* Images
* Long unbroken strings

No accidental horizontal page scrolling.

---

# 15. Sidebar Rule

Desktop:

Sidebar may remain visible.

Mobile:

Sidebar must become a drawer/overlay.

When the drawer opens:

* Prevent problematic background interaction.
* Provide close control.
* Allow navigation.
* Close appropriately after selecting a conversation where appropriate.

---

# 16. Composer Rule

Composer must:

* Work with keyboard
* Work with touch
* Grow naturally
* Have maximum height
* Scroll internally when necessary
* Remain usable on mobile
* Support Enter
* Support Shift+Enter

Never let the composer cover the last message permanently.

---

# 17. Accessibility Rule

Every interactive control needs:

* Visible purpose
* Keyboard accessibility
* Focus state
* Accessible name

Use semantic elements whenever possible.

Examples:

button for actions

a for navigation

input/textarea for input

dialog for dialogs

---

# 18. Error Rule

Errors should be useful to users.

Bad:

"Internal server error: ECONNRESET..."

Better:

"GENZ-AI couldn't complete that request. Please try again."

Log technical details server-side.

---

# 19. Logging

Do not log:

* Passwords
* API keys
* Tokens
* Full private documents
* Sensitive user data

Use structured logs where possible.

---

# 20. Rate Limiting

Protect expensive endpoints.

At minimum consider rate limits for:

* AI generation
* Login
* Signup
* Password reset
* Upload
* Search

Rate limits should be associated with an appropriate identity/IP strategy.

---

# 21. File Upload Rule

Before processing uploads:

1. Authenticate.
2. Authorize.
3. Check size.
4. Validate type.
5. Validate extension.
6. Store securely.
7. Associate with authenticated user.

Do not trust filename alone.

---

# 22. Environment Variables

Use:

.env.local

for local secrets.

Commit only:

.env.example

Never commit:

.env

.env.local

real API credentials

---

# 23. Dependency Rule

Before adding a package:

Ask:

* Is it necessary?
* Is there already a package doing this?
* Can native platform functionality solve it?
* Does it increase security risk?
* Does it significantly increase bundle size?

Avoid dependency bloat.

---

# 24. Component Rule

If a component becomes too large, split it.

Prefer:

ChatWindow

MessageList

Message

Composer

Sidebar

ConversationList

rather than one enormous component.

Do not over-engineer tiny components unnecessarily.

---

# 25. State Management

Use local React state when local state is sufficient.

Use server state/query caching when server data is involved.

Do not introduce a global state library unless the project genuinely needs it.

---

# 26. Database Performance

Avoid N+1 queries.

Use:

* Proper indexes
* Pagination
* Selective fields
* Efficient relations

Conversation history should not load unlimited records.

---

# 27. UI Consistency

Use shared design tokens.

Do not randomly invent:

* Padding
* Radius
* Font sizes
* Colors
* Shadows

Keep spacing and typography consistent.

---

# 28. Brand Rule

The product is:

GENZ-AI

Do not rename it to:

ChatGPT

GPT Chat

OpenAI Chat

or another brand.

Do not use proprietary logos.

---

# 29. AI Model Configuration

Keep model configuration centralized.

Do not scatter model IDs across components.

Example concept:

AI_DEFAULT_MODEL

AI_FAST_MODEL

AI_REASONING_MODEL

The actual supported model identifiers should be configured according to the current provider documentation.

---

# 30. API Error Handling

AI route should correctly handle:

400

401

403

404

429

500

502

504

Return predictable JSON or streaming-compatible errors.

Do not leak provider internals.

---

# 31. Testing Before Completion

Run:

lint

typecheck

tests

build

Then manually test:

signup

login

new chat

message

streaming

stop

regenerate

history

rename

delete

search

settings

logout

mobile drawer

dark mode

file upload

error states

---

# 32. Responsive QA

Check screenshots or browser dimensions for:

375 × 667

390 × 844

430 × 932

768 × 1024

820 × 1180

1024 × 768

1280 × 800

1440 × 900

1920 × 1080

Look specifically for:

* Overflow
* Overlapping controls
* Broken composer
* Hidden buttons
* Bad text wrapping
* Sidebar problems
* Modal problems
* Keyboard issues

---

# 33. Performance QA

Check:

* First load
* Chat navigation
* Long conversation
* Streaming
* Large code block
* Multiple attachments
* Slow network

Avoid unnecessary client JavaScript.

---

# 34. Security QA

Before completion verify:

* API key isn't in browser bundle.
* Users cannot access another user's conversation.
* Uploads are protected.
* Authentication is required.
* Server validates requests.
* Rate limits exist where required.
* Secrets are not committed.
* Error responses don't leak internals.

---

# 35. Git Rule

Make logical commits.

Examples:

feat: add chat streaming

feat: add conversation history

fix: prevent mobile composer overflow

fix: enforce conversation ownership

Do not make meaningless commits.

---

# 36. When Something Breaks

Use this process:

1. Reproduce.
2. Identify root cause.
3. Fix root cause.
4. Test regression.
5. Check related responsive states.
6. Run build/lint/typecheck.

Do not patch symptoms repeatedly.

---

# 37. When Requirements Are Ambiguous

Prefer:

1. Security
2. Correctness
3. Accessibility
4. Responsive behavior
5. Maintainability
6. Performance
7. Visual polish

in that order.

Do not block unnecessarily on minor design ambiguity.

---

# 38. Completion Rule

Never say:

"Done"

only because files were created.

The feature is complete only when:

* Code exists
* Code compiles
* TypeScript passes
* Lint passes
* Tests pass where applicable
* API works
* Database works
* Authentication works
* Responsive UI works
* Security checks pass
* Production build works

---

# 39. Final Agent Instruction

You are building a real product, not a mockup.

GENZ-AI must be:

secure

responsive

accessible

maintainable

production-oriented

and functional.

If a requirement cannot safely be implemented exactly as requested, choose a secure equivalent and clearly document the decision.

Never sacrifice security or user-data isolation for visual similarity.
