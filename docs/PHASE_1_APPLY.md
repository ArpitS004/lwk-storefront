# Phase 1 — how to apply

Everything is in one patch file: **`lwk-phase1.patch`**. Save it to your Mac (Downloads is fine).

Verified before delivery: applied to a clean clone of your exact commit `1ee759b`, then `pnpm install`, `tsc --noEmit` (0 errors), `vitest run` (26 tests pass), and `vite build` all succeeded.

---

## Step 1 — Vercel: add one variable, before you deploy

Settings → Environment Variables → **Add Another**, Production scope:

| Name | Value |
|---|---|
| `ALLOW_UNPAID_ORDERS` | `true` |

Checkout will return a 403 without it. It exists so the no-payment demo checkout can't be left switched on by accident once Razorpay is live.

Leave `Sensitive` unchecked — it's not a secret.

---

## Step 2 — apply the patch

In Terminal:

```
cd ~/lwk-storefront
git status
```

If anything is uncommitted, commit or stash it first. Then:

```
git apply --check ~/Downloads/lwk-phase1.patch
```

**No output means it will apply cleanly.** If you get an error, stop and send it to me. Then:

```
git apply ~/Downloads/lwk-phase1.patch
pnpm install
```

---

## Step 3 — verify locally before pushing

```
pnpm typecheck
pnpm test
pnpm build
```

All three should pass. `pnpm test` should report **26 passed**.

---

## Step 4 — migrate the database

```
pnpm db:push
```

This adds four columns to `users`: `is_admin`, `marketing_consent`, `consent_updated_at`, `unsubscribe_token`. All additive, no data loss.

**If it asks about truncating the users table, answer "No, add the constraint without truncating"** — same as last time. The unique constraint is on `unsubscribe_token`, and existing rows have NULL there, which Postgres allows any number of.

---

## Step 5 — make your account admin and give existing users unsubscribe tokens

Open your Neon dashboard → SQL Editor, and run:

```sql
-- 1. Make your account an admin.
UPDATE users
SET is_admin = true
WHERE email = 'thelwkclothing@gmail.com';

-- 2. Backfill unsubscribe tokens for accounts created before this change.
--    Without a token an account can never receive marketing email, by design.
UPDATE users
SET unsubscribe_token = encode(gen_random_bytes(24), 'hex')
WHERE unsubscribe_token IS NULL;

-- 3. Opt your own test account in, so you can demo the abandonment email.
--    Do NOT do this for anyone else — consent has to be their choice.
UPDATE users
SET marketing_consent = true, consent_updated_at = now()
WHERE email = 'thelwkclothing@gmail.com';

-- Check it worked:
SELECT email, is_admin, marketing_consent, unsubscribe_token IS NOT NULL AS has_token
FROM users;
```

Change the email in steps 1 and 3 if you want a different admin account.

---

## Step 6 — commit and push

```
git add -A
git commit -m "Phase 1: admin auth, marketing consent, stateless OAuth state, account menu, data-correctness fixes"
git push
```

Vercel deploys automatically on push. Wait for **Ready**.

---

## Step 7 — test on the live site

Work through these in order. Each one checks something specific that changed.

| # | Test | Expected |
|---|---|---|
| 1 | Log out, visit `/admin` | "Restricted" page, not the dashboard |
| 2 | Open `/api/segments` directly in a browser tab while logged out | `{"error":"Not logged in"}` — not visitor data |
| 3 | Log in with your admin account, visit `/admin` | Dashboard loads normally |
| 4 | Click your name in the navbar | A menu opens (Account / Orders / Profile / Admin / Log Out). **It does not log you out** |
| 5 | Click Log Out in that menu | Signs out, returns home |
| 6 | Sign in with Google **in Safari** | Works — this is the fix for the "session expired" error |
| 7 | Create a new account at `/signup` | Consent checkbox present, unticked by default |
| 8 | Visit `/account` | Profile and a working marketing email toggle |
| 9 | Visit `/account/orders` | Your own orders only |
| 10 | `/admin` → Send Cart Abandonment Email to your own address | Sends; the email has an Unsubscribe link at the bottom |
| 11 | Same, but to an address with no LWK account | Refuses with a clear error instead of sending |
| 12 | Click Unsubscribe in the email | Confirmation page; `/account` now shows the toggle off |

If any of these behaves differently, tell me the number and what happened.

---

## What changed, and why

### Security

- **`/admin` and its APIs now require an admin account.** `GET /segments`, `GET /analytics/summary` and `POST /automations/abandoned-cart` were readable and callable by anyone on the internet. The last of those could send email from your Resend account to any address.
- **The admin check reads the database on every request** rather than trusting a flag inside the session token. Sessions last 30 days; a token-baked claim would keep working for a month after you revoked someone's access.
- **`CRON_SECRET` now fails closed in production.** Previously, if the variable went missing the abandonment endpoint accepted every caller — a public mass-send trigger. It now refuses instead.
- **`POST /orders` is gated behind `ALLOW_UNPAID_ORDERS`.** Unguarded it let anyone create order records and trigger confirmation emails.
- **OAuth error messages are fixed codes, not free text.** The callback used to put an arbitrary string into `?error=` which the login page rendered, so a crafted link could make your own site display any message.

### Consent

- Four new columns on `users`. Marketing consent defaults to **false** and is only ever set by an explicit action.
- Signup has an unticked opt-in checkbox. `/account` has a toggle.
- Every marketing email carries an unsubscribe link plus `List-Unsubscribe` headers, which give Gmail and Outlook a native unsubscribe button and reduce spam complaints.
- **Signing in with Google does not grant consent.** Authentication is not permission to market.
- The abandonment check filters to opted-in accounts, and the manual admin button goes through the same gate — a demo button that can bypass consent is a demo button that eventually will.

### Correctness

- **Product views were counted roughly double.** The product page fired `product_view` twice per visit, once on mount and once on unmount. The unmount event is now `product_view_ended`, and the analytics queries also exclude the historical duplicates, so your existing numbers correct themselves.
- **Abandonment emails ignored removals.** They were built from `add_to_cart` events only, so removing two of three items and leaving still advertised all three back to you. Adds and removes are now replayed in order.

### Safari sign-in

The OAuth `state` was stashed in a cookie and compared on the callback, which meant sign-in depended on a cookie surviving a cross-site redirect. Safari refused. It is now a self-contained HMAC-signed token — same CSRF protection, no cookie involved, no browser variance.

### Tests

Vitest, with 26 tests over the two things where a mistake reaches a real person: the send/don't-send rules and the OAuth state token. The decision logic moved into `api/_lib/abandonment-rules.ts` as pure functions — testable without a database, and the seed of the Phase 4 rule engine.

### Operations

- `api/_lib/env.ts` validates configuration at startup and logs which integrations are live. A cold start now prints something like:
  `[env] email(resend)=on ai(deepseek)=on google-signin=on payments(razorpay)=OFF cron-auth=on abandonment-threshold=2min`
  That single line is what would have shown, weeks ago, that no email was being sent.
- `.env.example` documents all 16 variables. It previously listed 7 of 15.

---

## What did NOT change

Storefront design, product pages, cart, checkout flow, wishlist, collections, payments, seeding, and the existing email templates' look. No table was dropped or altered destructively. No route was removed.

---

## Rollback

```
git revert HEAD
git push
```

The four new database columns can stay — they are nullable or defaulted and nothing breaks if unused. Set `ALLOW_UNPAID_ORDERS` back if you had changed it.

---

## Known gaps, deliberately left for later phases

- No rate limiting yet (Phase 12). `/api/events` still accepts unlimited writes.
- `GET /orders/:orderNumber` still returns order details to anyone with the number (Phase 12).
- Sessions still cannot be revoked before their 30-day expiry (Phase 12).
- `GET /segments` still makes one DeepSeek call per visitor on every load and will time out as traffic grows (Phase 3/8).
- No database indexes on `events` yet (Phase 12).
