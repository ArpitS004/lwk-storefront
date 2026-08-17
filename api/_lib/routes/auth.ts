import { randomBytes } from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "../db/index.js";
import { hashPassword, verifyPassword, signSession, verifySession, SESSION_COOKIE } from "../auth.js";
import { buildGoogleAuthUrl, exchangeCodeForUserInfo, isGoogleAuthConfigured } from "../google-auth.js";
import { createOAuthState, verifyOAuthState } from "../oauth-state.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

/** Unguessable token for one-click unsubscribe links. */
function newUnsubscribeToken(): string {
  return randomBytes(24).toString("hex");
}

// Fixed error codes rather than free text in the redirect URL. Previously
// the callback put an arbitrary message into ?error=, which the login page
// renders — meaning anyone could craft a link that made our own UI display
// whatever they liked. The client maps these codes to copy instead.
const OAUTH_ERRORS = {
  notConfigured: "google_not_configured",
  cancelled: "google_cancelled",
  badState: "google_bad_state",
  failed: "google_failed",
} as const;

const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().optional(),
  // Opt-in only. Absent or false means no marketing mail, ever, until the
  // person changes it themselves.
  marketingConsent: z.boolean().optional(),
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const consent = parsed.data.marketingConsent === true;

  const [user] = await db
    .insert(usersTable)
    .values({
      email: parsed.data.email,
      passwordHash,
      fullName: parsed.data.fullName ?? null,
      marketingConsent: consent,
      consentUpdatedAt: new Date(),
      unsubscribeToken: newUnsubscribeToken(),
    })
    .returning();

  const token = signSession({ userId: user.id, email: user.email });
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.status(201).json({
    email: user.email,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    marketingConsent: user.marketingConsent,
  });
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!user || !user.passwordHash) {
    // Either no account, or one created via Google sign-in with no
    // password to check against — same generic message either way so we
    // don't leak which emails have accounts.
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signSession({ userId: user.id, email: user.email });
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.json({
    email: user.email,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    marketingConsent: user.marketingConsent,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).end();
});

// --- Google sign-in ---
// Standard OAuth 2.0 authorization-code redirect flow. `state` is a random
// value stashed in a short-lived cookie and checked again on the callback
// as CSRF protection (an attacker can't forge a callback hit without also
// controlling the victim's cookie jar).

router.get("/auth/google", (_req, res): void => {
  if (!isGoogleAuthConfigured()) {
    res.status(503).send("Google sign-in isn't configured yet.");
    return;
  }

  // Signed, self-expiring state — no cookie has to survive the redirect
  // chain, which is what broke sign-in in Safari. See oauth-state.ts.
  res.redirect(buildGoogleAuthUrl(createOAuthState()));
});

router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const redirectHome = () => res.redirect("/");
  const redirectWithError = (code: string) => res.redirect(`/login?error=${code}`);

  if (!isGoogleAuthConfigured()) {
    redirectWithError(OAUTH_ERRORS.notConfigured);
    return;
  }

  const { code, state, error: googleError } = req.query as Record<string, string | undefined>;

  if (googleError) {
    redirectWithError(OAUTH_ERRORS.cancelled);
    return;
  }

  if (!code || !verifyOAuthState(state)) {
    redirectWithError(OAUTH_ERRORS.badState);
    return;
  }

  try {
    const profile = await exchangeCodeForUserInfo(code);

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, profile.email));

    let user: typeof existing;
    if (existing) {
      // Link the Google account to an existing email/password account the
      // first time they use "Continue with Google" with the same email.
      if (!existing.googleId) {
        [user] = await db
          .update(usersTable)
          .set({
            googleId: profile.googleId,
            avatarUrl: profile.picture ?? existing.avatarUrl,
            // Backfill for accounts created before unsubscribe tokens existed.
            unsubscribeToken: existing.unsubscribeToken ?? newUnsubscribeToken(),
          })
          .where(eq(usersTable.id, existing.id))
          .returning();
      } else {
        user = existing;
      }
    } else {
      [user] = await db
        .insert(usersTable)
        .values({
          email: profile.email,
          passwordHash: null,
          googleId: profile.googleId,
          fullName: profile.name ?? null,
          avatarUrl: profile.picture ?? null,
          // Signing in with Google is authentication, not consent to
          // marketing. They opt in explicitly from their account page.
          marketingConsent: false,
          consentUpdatedAt: new Date(),
          unsubscribeToken: newUnsubscribeToken(),
        })
        .returning();
    }

    const token = signSession({ userId: user.id, email: user.email });
    res.cookie(SESSION_COOKIE, token, cookieOptions);
    redirectHome();
  } catch (err) {
    console.error("Google sign-in failed:", err);
    redirectWithError(OAUTH_ERRORS.failed);
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const session = verifySession(token);
  if (!session) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const [user] = await db
    .select({
      email: usersTable.email,
      fullName: usersTable.fullName,
      avatarUrl: usersTable.avatarUrl,
      isAdmin: usersTable.isAdmin,
      marketingConsent: usersTable.marketingConsent,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user) {
    res.status(401).json({ error: "Account no longer exists" });
    return;
  }

  res.json(user);
});

// Lets a signed-in customer turn marketing email on or off from their
// account page. Every change stamps consent_updated_at, so there is always
// an answer to "when did this person opt in".
const ConsentBody = z.object({ marketingConsent: z.boolean() });

router.patch("/auth/consent", async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE];
  const session = token ? verifySession(token) : null;
  if (!session) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const parsed = ConsentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      marketingConsent: parsed.data.marketingConsent,
      consentUpdatedAt: new Date(),
    })
    .where(eq(usersTable.id, session.userId))
    .returning({ marketingConsent: usersTable.marketingConsent });

  if (!updated) {
    res.status(401).json({ error: "Account no longer exists" });
    return;
  }

  res.json(updated);
});

export default router;
