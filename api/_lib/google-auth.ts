// Minimal, dependency-free Google OAuth 2.0 (Authorization Code flow).
// We intentionally don't add a library like passport or google-auth-library
// for this — it's three HTTP calls, and doing it directly keeps the
// dependency surface (and thus the risk of another build-breaking version
// mismatch) as small as possible.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getRedirectUri(): string {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    throw new Error(
      "APP_BASE_URL must be set (e.g. https://lwk-storefront-d4s2.vercel.app) — it must exactly match the redirect URI registered in Google Cloud Console.",
    );
  }
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_BASE_URL);
}

/**
 * Builds the URL to send the browser to in order to start Google sign-in.
 * `state` should be a random value the caller also stashes in a short-lived
 * cookie, then verifies matches on the callback — this is the standard
 * CSRF protection for OAuth redirects.
 */
export function buildGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID must be set.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Exchanges an OAuth `code` for the signed-in user's verified profile.
 * Throws on any failure — the caller decides how to surface that to the
 * browser (redirect to login with an error, in our case).
 */
export async function exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET must be set.");
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "");
    throw new Error(`Google token exchange failed (${tokenRes.status}): ${body}`);
  }

  const tokenData: { access_token?: string } = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("Google token exchange succeeded but returned no access_token.");
  }

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    const body = await userRes.text().catch(() => "");
    throw new Error(`Google userinfo request failed (${userRes.status}): ${body}`);
  }

  const profile: {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  } = await userRes.json();

  if (!profile.email) {
    throw new Error("Google account has no email on file — cannot sign in.");
  }

  return {
    googleId: profile.sub,
    email: profile.email,
    emailVerified: Boolean(profile.email_verified),
    name: profile.name,
    picture: profile.picture,
  };
}
