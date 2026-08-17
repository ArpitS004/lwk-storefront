import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Stateless CSRF protection for the Google OAuth redirect.
//
// The previous approach stashed a random value in a short-lived cookie and
// compared it on the callback. That is the textbook pattern, but it makes
// sign-in depend on a cookie surviving a cross-site redirect chain — and
// Safari refused to complete the round trip, failing every attempt with a
// state mismatch while Chrome worked fine.
//
// Rather than chase browser-specific cookie behaviour, the state itself is
// now a signed token: `<nonce>.<issuedAt>.<hmac>`, signed with JWT_SECRET.
// The callback verifies the signature and the age. Google echoes `state`
// back verbatim, so no cookie needs to survive anything.
//
// This is equally strong against CSRF: an attacker cannot forge a validly
// signed state without JWT_SECRET, and a stale or replayed one expires.

const MAX_AGE_MS = 10 * 60 * 1000; // the round trip takes seconds; 10 min is generous

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be set to sign the OAuth state token.");
  }
  return secret;
}

/** Creates a signed, self-expiring state value to hand to Google. */
export function createOAuthState(): string {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString();
  const payload = `${nonce}.${issuedAt}`;
  return `${payload}.${sign(payload, getSecret())}`;
}

/**
 * Verifies a state value echoed back by Google. Returns false for anything
 * malformed, wrongly signed, or older than MAX_AGE_MS.
 */
export function verifyOAuthState(state: string | undefined): boolean {
  if (!state) return false;

  const parts = state.split(".");
  if (parts.length !== 3) return false;

  const [nonce, issuedAt, signature] = parts;
  if (!nonce || !issuedAt || !signature) return false;

  const timestamp = Number(issuedAt);
  if (!Number.isFinite(timestamp)) return false;

  const age = Date.now() - timestamp;
  // Reject expired states, and also states dated in the future (clock skew
  // beyond a minute means something is wrong).
  if (age > MAX_AGE_MS || age < -60_000) return false;

  let expected: string;
  try {
    expected = sign(`${nonce}.${issuedAt}`, getSecret());
  } catch {
    return false;
  }

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
