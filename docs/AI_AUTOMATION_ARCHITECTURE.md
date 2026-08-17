# LWK — AI Automation Architecture

**Phase 0 deliverable: repository audit + proposed architecture**
Date: 17 August 2026 · Repo: `ArpitS004/lwk-storefront` · Production: `https://lwk-storefront-d4s2.vercel.app`

> **Status: audit only. No code has been modified.** This document ends with a Phase 1 work order awaiting your approval.

---

## 0. Headline

The storefront is well-built. The architecture is clean, the code is readable and commented, TypeScript compiles with zero errors, and the AI/automation groundwork is genuinely reusable. The problems are not architectural — they are **missing guardrails on endpoints that are live in production right now**.

Three things need fixing before any new feature work, and one of them is urgent:

1. **`POST /api/automations/abandoned-cart` is an unauthenticated open email relay.** Anyone on the internet can send email from your Resend account, to any address, right now. This is a spam-abuse and sender-reputation risk, not a theoretical one.
2. **`/admin` and its APIs have no authentication at all.** Every customer analytics record is public at a guessable URL.
3. **There is no consent model anywhere in the schema.** The system currently sends marketing email to anyone who logs in and leaves a cart, with no opt-in and no unsubscribe link. Your own Phase 4/6 requirements depend on this existing, and so does compliance.

Everything else in your 13-phase plan is sound and buildable on what's already here. My recommendation is to reorder slightly: fold the security fixes into Phase 1 rather than leaving them to Phase 12.

---

## 1. Method and scope

- Read every file under `api/` and `src/` (excluding generated `src/components/ui/*` shadcn primitives and generated API clients).
- Traced all 24 API routes, all 10 database tables, all 15 environment variables, and every `trackEvent` call site.
- Ran `tsc --noEmit`: **clean, 0 errors.** (The TypeScript errors previously seen in Vercel build logs do not reproduce locally and did not block deployment — they are an artefact of Vercel's dependency resolution, not real defects.)
- Did not run destructive commands, did not modify code, did not touch the database.

**One caveat on the working tree:** the sandbox copy sits at commit `e5f9a5d` with the Google-login/cart-abandonment work present as uncommitted changes. Your Mac has these committed as `1ee759b`. The file contents match; only the commit boundary differs. Nothing in this audit depends on that difference.

---

## 2. Current architecture, as built

```
Browser (React 19 + Vite SPA)
  │
  ├─ localStorage: cart, wishlist, visitor_id, theme
  ├─ httpOnly cookie: lwk_session (JWT, 30d)
  │
  ▼
vercel.json rewrites  /api/*  →  api/index.ts
  │
  ▼
Express app (api/_lib/app.ts)     ← single serverless function
  pino-http → cors() → cookie-parser → json → /api router
  │
  ├── auth.ts        signup, login, logout, google, google/callback, me
  ├── products.ts    list, detail, related, reviews
  ├── collections.ts list, detail
  ├── orders.ts      create (no payment), get by number
  ├── payments.ts    razorpay create-order, verify
  ├── events.ts      POST /events  (behavioural beacon)
  ├── segments.ts    GET /segments, GET /analytics/summary
  ├── automations.ts POST /automations/abandoned-cart  (manual demo trigger)
  ├── cart-abandonment.ts  POST /cart-abandonment/check  (scheduled)
  ├── newsletter.ts, contact.ts, health.ts
  │
  ├─→ Drizzle ORM → pg.Pool → Neon Postgres
  ├─→ email.ts   → Resend
  └─→ deepseek.ts → DeepSeek chat/completions (6s timeout, always falls back)

cron-job.org (external, 1/min)  →  POST /api/cart-abandonment/check
                                    with Authorization: Bearer CRON_SECRET
```

**Why the external scheduler:** Vercel's Hobby plan caps Cron Jobs at once per day, which is too coarse for a 30-minute abandonment window. cron-job.org is the correct workaround and the endpoint is already designed for it.

### Database tables (10)

| Table | Purpose | Notes |
|---|---|---|
| `users` | accounts | `password_hash` nullable (Google accounts), `google_id` unique |
| `products` | catalogue | has `in_stock`, `stock_count`, `trending_score` — unused by automation so far |
| `collections` | drops | |
| `reviews` | product reviews | read-only, no write route |
| `orders` | orders | created by two different routes (see finding H-4) |
| `events` | behavioural events | `email` filled server-side from session |
| `customer_segments` | computed segments | `email` column exists but is **never written** |
| `cart_abandonment_emails` | send log / dedup | |
| `newsletter_subscriptions` | email capture | **not linked to any consent logic** |
| `contact_messages` | contact form | |

### Environment variables (15 in use)

`DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `DEEPSEEK_API_KEY`, `CRON_SECRET`, `ABANDONMENT_THRESHOLD_MINUTES`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `API_PORT`, `LOG_LEVEL`, `NODE_ENV`

**`.env.example` documents only 7 of these.** Missing: `JWT_SECRET`, `APP_BASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`, `ABANDONMENT_THRESHOLD_MINUTES`, `LOG_LEVEL`. This violates your own development rule #5.

---

## 3. Findings

Severity: **C**ritical (exploitable now, real-world harm) · **H**igh (breaks or will break) · **M**edium · **L**ow.

### C-1 · Open email relay — `automations.ts:24`

`POST /api/automations/abandoned-cart` accepts an arbitrary `email` and `items[]` from any caller with no authentication and no rate limit, then sends mail through your Resend account. A single script can send unlimited email from your domain to arbitrary recipients. Consequences: Resend account suspension, sender-domain blacklisting, and once you move off the sandbox sender, reputational damage to the real LWK domain.

**Fix:** require an authenticated admin session. Keep the route (it is a good demo tool), gate it.

### C-2 · Admin surface completely unauthenticated — `App.tsx:39`, `segments.ts:32,119`

`/admin` renders for anyone. `GET /api/segments` and `GET /api/analytics/summary` return every tracked visitor, their behaviour counts, and AI-written behavioural summaries, to any unauthenticated caller. There is no admin role in the schema at all.

**Fix:** add an `is_admin` flag on `users`, a `requireAdmin` middleware, and a client-side guard on the route.

### C-3 · No consent model exists

Nothing in the schema records marketing consent. `newsletter_subscriptions` is written by the footer form but is never consulted before sending an abandonment email. No email contains an unsubscribe link.

Order confirmations are transactional and fine. The abandonment nudge is **marketing** — under India's DPDP Act 2023, and under GDPR/CAN-SPAM for any non-Indian customer, it needs a recorded opt-in and a working unsubscribe. This is also a hard prerequisite for your own Phases 4, 6 and 7; the rule engine cannot check a consent flag that does not exist.

**Fix:** `marketing_consent` + `consent_updated_at` + `unsubscribe_token` on `users`, a consent checkbox at signup and checkout, a `GET /unsubscribe/:token` route, and an unsubscribe footer on every marketing email. I am not a lawyer — for the final compliance wording, get it reviewed.

### C-4 · Cron secret fails open — `cart-abandonment.ts:24`

```ts
if (!secret) return true;   // no CRON_SECRET configured → allow anyone
```

If `CRON_SECRET` is ever unset or misspelled in Vercel, the abandonment endpoint becomes public and anyone can trigger a mass send. Convenient for local dev, dangerous in production.

**Fix:** fail open only when `NODE_ENV !== "production"`; fail closed otherwise.

### H-1 · Product view counts are roughly double — `product.tsx:44` and `:53`

`product_view` fires twice per visit: once on mount, once on unmount with `left: true`. `/analytics/summary` counts `type = 'product_view'` with no filter, and so does the "Most Viewed Products" list and the `interested_buyer` segment threshold (`productViews >= 3`).

Every product-view number on your admin dashboard is inflated by about 2x, and visitors reach `interested_buyer` after roughly 1.5 real product views instead of 3.

**Fix:** either use a distinct `product_view_ended` event type, or filter `payload->>'left' IS NULL` in every aggregate. The former is cleaner and lines up with the `product_view_repeated` type you asked for in Phase 2.

### H-2 · Abandonment emails ignore cart removals — `cart-abandonment.ts:102`

The candidate cart is reconstructed from `add_to_cart` events only. `remove_from_cart` is tracked but never read. A customer who adds three items, removes two, and leaves will be emailed about all three — including the two they deliberately rejected.

**Fix:** reconcile adds against removes per product slug before building the item list.

### H-3 · `/api/segments` will time out and is expensive — `segments.ts:32`

Every `GET /segments` (admin page load, and every "Refresh" click) loops over up to 50 visitors and makes a **sequential** DeepSeek call per visitor, each with a 6-second timeout, plus a DB upsert per visitor. Worst case is roughly 300 seconds of wall time against a Vercel function limit of 10s (Hobby default) to 60s (configured maximum).

This works today only because you have very few visitors. It will start failing as soon as real traffic arrives — quietly, as a 504 on the admin page.

**Fix:** decouple. Compute segments deterministically on read (fast, no AI). Generate and cache the AI insight text separately — on write, on a schedule, or on explicit request — and store it in `customer_segments.insight` rather than regenerating every page load.

### H-4 · Two order-creation paths, the unsafe one is the live one — `orders.ts:21` vs `payments.ts:62`

`POST /orders` creates a real order row and sends a confirmation email with no payment, no authentication, and no rate limit. It is what `checkout.tsx` currently calls. `POST /payments/verify` is the correct path with HMAC signature verification, and is unused. `generateOrderNumber()` is duplicated verbatim in both files.

Secondary effect: `POST /orders` is a second open email relay (arbitrary `email` → confirmation email).

**Fix:** keep the demo path but gate it behind an explicit `ALLOW_UNPAID_ORDERS` flag that is off in production, and extract the shared order-creation logic into one service function.

### H-5 · No rate limiting anywhere

`POST /api/events` accepts unlimited writes with a client-supplied `visitorId`. Anyone can flood the `events` table, inflate your Neon storage and compute bill, and poison every segment and analytics number. Same exposure on `/contact`, `/newsletter`, `/auth/login` (no brute-force protection) and `/orders`.

**Fix:** per-IP rate limits at the middleware layer, tightest on write endpoints.

### H-6 · No indexes on `events`

The abandonment check runs two full `GROUP BY` aggregations over `events` **every minute**, forever. There is no index on `type`, `created_at`, `email`, or `visitor_id`. This is fine at today's row count and will degrade predictably as events accumulate — and the cost lands on your Neon bill.

**Fix:** composite indexes on `(type, created_at)`, `(email, type, created_at)`, `(visitor_id)`.

### M-1 · Order lookup exposes PII without authentication — `orders.ts:53`

`GET /api/orders/:orderNumber` returns full name, street address, email and line items to anyone with the order number. Order numbers are `LWK-{base36 timestamp}{6 random base36}` and `Math.random()`-derived. Brute force is expensive but the endpoint should require either an owning session or a signed link.

### M-2 · Sessions cannot be revoked

`signSession` issues a 30-day JWT with no `jti` and no server-side record. `POST /auth/logout` only clears the cookie — a captured token stays valid for the full 30 days. There is no "log out all devices" and no way to kill a session after a password change.

### M-3 · `cors()` is fully open — `app.ts:29`

Default `cors()` allows every origin. Credentials are not enabled, so browsers will not send `lwk_session` cross-origin, which limits the damage — but the API should be restricted to your own origins regardless.

### M-4 · Google OAuth state is cookie-dependent; Safari fails

Sign-in works in Chrome and fails in Safari with "Google sign-in session expired", which is the state-cookie mismatch branch at `auth.ts:145`. My working hypothesis is Safari's handling of a `Set-Cookie` issued on the same 302 that redirects to Google — **but I have not proven this**, and `SameSite=Lax` should in principle survive a top-level GET redirect, so the obvious explanation may not be the right one.

Rather than chase browser-specific cookie behaviour, the durable fix removes the dependency entirely: make `state` a **stateless HMAC-signed token** (nonce + timestamp, signed with `JWT_SECRET`) and verify the signature on callback instead of comparing against a cookie. Same CSRF protection, no cookie round-trip, no browser variance. I recommend this over patching `sameSite`.

### M-5 · Error text is injected into the UI from the URL — `auth.ts:128`, `login.tsx:16`

The callback redirects to `/login?error=<free text>` and the login page renders that string. React escapes it so there is no XSS, but anyone can craft a link that makes your own login page display an arbitrary message ("Your account was suspended, call…"). Map to a fixed set of error codes instead.

### M-6 · New `pg.Pool` per serverless cold start — `db/index.ts`

Each cold start opens a fresh connection pool against Neon. Under concurrency this exhausts connection limits. Neon's serverless driver, or a pool capped at `max: 1`, is the standard fix for this deployment shape.

### M-7 · `JWT_SECRET` missing takes down the entire API

`auth.ts` throws at module load, so a missing secret 500s every route including `/healthz`. Fail-fast is right; a single validated env module with a clear message is better than an opaque crash.

### L-1 · Duplicated `EVENT_TYPES` in `src/lib/track-types.ts` and `api/_lib/db/schema/events.ts` — intentional and documented, but a drift risk. A shared `types/` module imported by both would remove it.

### L-2 · `customer_segments.email` is declared and never written. Dead column.

### L-3 · `LOOKBACK_HOURS` serves three different concepts in `cart-abandonment.ts` (activity window, resend cooldown, item-resolution window). Split into three named constants.

### L-4 · 7 of the 9 event types you asked for in Phase 2 are missing: `product_view_repeated`, `collection_view`, `size_selection`, `color_selection`, `checkout_abandoned`, `login`, `signup`. `search` is defined in the enum but **never fired** anywhere in the frontend.

### L-5 · Wishlist and cart are localStorage-only, so cart state is never authoritative server-side. The abandonment engine infers it from events. Workable now; a server-side cart becomes necessary for Phase 6 conversion attribution.

### L-6 · No test suite of any kind exists. No unit, integration, or E2E tests.

---

## 4. What to keep, what to change

**Keep as-is — these are good and reusable:**

- The whole `api/_lib/` layout: routes / services / schema separation is clean.
- `deepseek.ts`'s always-resolves-with-fallback contract. This is exactly the right pattern for AI in a delivery path and should be the template for every future AI call.
- `email.ts`'s explicit Resend `{ error }` checking.
- The generic `events` table shape (`type` + jsonb `payload`). It scales to all 16 event types without a migration.
- The deterministic `classify()` function in `segments.ts` — rules first, AI for explanation only. This is already the philosophy you describe in Phase 4.
- `google-auth.ts`'s dependency-free OAuth implementation.
- `track.ts`'s `sendBeacon`-with-fetch-fallback, never-throws design.

**Change:**

- Consent, admin auth, and rate limiting need to exist before more automation is layered on.
- The AI insight generation must move off the read path.
- Order creation needs to converge on one service function.

**Do not build yet:** WhatsApp (Phase 7) beyond the provider interface, and ML recommendations (Phase 10). You do not have the data volume to justify either, and your own instructions correctly say not to pretend otherwise.

---

## 5. Proposed target architecture

The key structural change is inserting a **deterministic decision layer between events and messaging**, so AI never decides who gets contacted — only what the copy says.

```
events (raw)
   │
   ▼
Behaviour layer  ──────►  customer_profiles
  derived metrics only     engagement_score, abandonment_count,
  recomputed, never          avg_order_value, last_activity_at,
  guessed                    preferred_categories
   │
   ▼
Rule engine  (deterministic — the ONLY thing that decides "send / don't send")
   consent? cooldown? already sent? purchased since? in stock? frequency cap?
   │
   ├── not eligible ──► logged with a reason, nothing sent
   │
   ▼ eligible
Campaign builder
   │
   ├─► AI copy service (DeepSeek)  ← receives a safe, structured brief
   │     constrained to: tone, length, product names. Falls back on failure.
   │     Cannot see consent state. Cannot change the send decision.
   │
   ▼
NotificationProvider  (interface)
   ├── EmailProvider     → Resend            (live)
   └── WhatsAppProvider  → official BSP API  (interface only, not implemented)
   │
   ▼
messages table  →  queued → sent → delivered → opened → clicked → converted
                   every state change logged, campaign_id on every row
```

**New tables this implies** (all additive, none destructive):

`customer_profiles`, `campaigns`, `messages`, `message_events`, `automation_rules`, plus consent columns on `users`.

`cart_abandonment_emails` becomes redundant once `messages` exists — but keep it, stop writing to it, and migrate reads. Do not drop it.

---

## 6. Revised phase plan

Your ordering is good. I am proposing three changes, each with a reason:

| Your plan | Proposed | Why |
|---|---|---|
| Security in Phase 12 | **Critical items move into Phase 1** | C-1 through C-4 are exploitable in production today. Building nine more phases on top of an open email relay compounds the problem. |
| Consent in Phase 6 | **Consent schema moves to Phase 1** | The Phase 4 rule engine cannot check a flag that does not exist. Retrofitting consent onto live automation is harder than starting with it. |
| Phase 11 frontend polish late | **Keep it late** | Agreed. It is the most visible and least risky, and it should not block the engine work. |

Everything else runs in your order. Phases 7 and 10 stay design-only until there is data to justify them.

---

## 7. Phase 1 work order — awaiting your approval

### Objective

Close the four critical security gaps, fix the two data-correctness bugs, add the consent foundation, and fix the account-menu UX. No new AI features. Production stays up throughout.

### Proposed changes

**A. Admin authentication (C-1, C-2)**
- `users.is_admin` boolean, default false. Migration is additive.
- `requireAdmin` middleware in `api/_lib/middleware/require-admin.ts`.
- Applied to `GET /segments`, `GET /analytics/summary`, `POST /automations/abandoned-cart`.
- Client guard on `/admin` — redirect to `/login` when not an admin.
- You promote your own account with a one-line SQL `UPDATE`, run by you.

**B. Cron secret fails closed (C-4)**
- `CRON_SECRET` becomes mandatory when `NODE_ENV === "production"`.

**C. Consent foundation (C-3)**
- `users.marketing_consent` (bool, default false), `consent_updated_at`, `unsubscribe_token` (unique).
- Consent checkbox at signup and checkout, unchecked by default.
- `GET /api/unsubscribe/:token` — one click, no login required.
- Unsubscribe footer on the abandonment email. Order confirmations are transactional and unchanged.
- The abandonment check filters to `marketing_consent = true`.

  **Note:** this will reduce your abandonment sends to zero until people opt in. That is correct behaviour, and it is worth knowing before a demo. If you need the demo to keep working, opt your own test account in via SQL.

**D. Data-correctness fixes (H-1, H-2)**
- Split `product_view_ended` out of `product_view`; update all aggregates.
- Reconcile `remove_from_cart` against `add_to_cart` in the abandonment candidate builder.

**E. Account menu (your explicit Phase 1 ask)**
- Replace the click-to-logout button with a shadcn `DropdownMenu`: Account · Orders · Profile · Logout.
- `/account/orders` needs a `GET /api/account/orders` route (session-scoped, returns only the caller's own orders). Profile can be a stub this phase.

**F. Environment validation and documentation**
- `api/_lib/env.ts` validating all 15 variables at startup with clear messages.
- `.env.example` completed — all 15, documented.

### Files affected

| Area | Files |
|---|---|
| New | `api/_lib/env.ts`, `api/_lib/middleware/require-admin.ts`, `api/_lib/routes/account.ts`, `api/_lib/routes/unsubscribe.ts`, `src/components/account-menu.tsx`, `src/pages/account-orders.tsx` |
| Modified | `db/schema/users.ts`, `routes/auth.ts`, `routes/segments.ts`, `routes/automations.ts`, `routes/cart-abandonment.ts`, `routes/index.ts`, `email.ts`, `app.ts`, `src/components/navbar.tsx`, `src/pages/product.tsx`, `src/pages/checkout.tsx`, `src/pages/signup.tsx`, `src/lib/track-types.ts`, `.env.example` |

Roughly 20 files. No file is rewritten wholesale; no working feature is removed.

### Database changes

Additive only — four nullable/defaulted columns on `users` (`is_admin`, `marketing_consent`, `consent_updated_at`, `unsubscribe_token`). Applied via `pnpm db:push`. **If drizzle-kit offers to truncate, the answer is No** — same as last time.

### API changes

Added: `GET /api/account/orders`, `GET /api/unsubscribe/:token`.
Newly protected: `GET /segments`, `GET /analytics/summary`, `POST /automations/abandoned-cart`.
Behaviour changed: `POST /cart-abandonment/check` now requires `CRON_SECRET` in production and filters by consent.
Nothing removed. No breaking changes to any route the storefront currently calls.

### Frontend changes

Account dropdown, orders page, consent checkboxes, one tracking-call change on the product page. No visual redesign — that is Phase 11.

### Security considerations

Closes C-1, C-2, C-3, C-4. Leaves H-5 (rate limiting), M-1 (order PII), M-2 (session revocation), M-3 (CORS) and M-4 (Safari OAuth) for Phase 12 unless you want M-4 pulled forward, which I would support since it is a small, self-contained change with a user-visible payoff.

### Tests

No test framework exists yet, so Phase 1 introduces Vitest with a small suite covering: consent filtering, admin middleware allow/deny, unsubscribe token validity, and the add/remove cart reconciliation. Plus a manual QA pass on the full purchase and login flows in Chrome and Safari.

### Deployment requirements

`CRON_SECRET` must be set in Vercel Production **before** this deploys, or the abandonment endpoint will start returning 401 to cron-job.org. No other new environment variables.

### Rollback

Every change is additive. Rollback is `git revert` plus one redeploy; the new columns can stay in place harmlessly. The only irreversible step is the `db:push`, and adding nullable columns is safe to leave applied.

### Estimated scope

One focused working session for A, B, D, E, F; consent (C) is the largest single piece because it touches signup, checkout, email and the abandonment filter.

---

## 8. What I need from you before starting

1. **Approval to begin Phase 1**, or a request to reorder any of A–F.
2. **A decision on consent vs. the demo.** Turning consent on stops abandonment emails to anyone who has not opted in. If you have a presentation coming up, say so and I will make the consent default demo-safe and flag it clearly in the code as a temporary setting.
3. **Confirmation of which email address should be the admin account.**
4. **Whether to pull the Safari OAuth fix (M-4) into Phase 1.** My recommendation: yes.

No code will be touched until you reply.
