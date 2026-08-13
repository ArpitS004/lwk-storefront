import { randomBytes } from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "../db/index.js";
import { hashPassword, verifyPassword, signSession, verifySession, SESSION_COOKIE } from "../auth.js";
import { buildGoogleAuthUrl, exchangeCodeForUserInfo, isGoogleAuthConfigured } from "../google-auth.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

const OAUTH_STATE_COOKIE = "lwk_oauth_state";
const oauthStateCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 10 * 60 * 1000, // the redirect round-trip only takes seconds; 10 min is generous
  path: "/",
};

const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().optional(),
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

  const [user] = await db
    .insert(usersTable)
    .values({
      email: parsed.data.email,
      passwordHash,
      fullName: parsed.data.fullName ?? null,
    })
    .returning();

  const token = signSession({ userId: user.id, email: user.email });
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.status(201).json({ email: user.email, fullName: user.fullName });
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
  res.json({ email: user.email, fullName: user.fullName });
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

  const state = randomBytes(24).toString("hex");
  res.cookie(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions);
  res.redirect(buildGoogleAuthUrl(state));
});

router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const redirectHome = () => res.redirect("/");
  const redirectWithError = (message: string) => res.redirect(`/login?error=${encodeURIComponent(message)}`);

  if (!isGoogleAuthConfigured()) {
    redirectWithError("Google sign-in isn't configured yet.");
    return;
  }

  const { code, state, error: googleError } = req.query as Record<string, string | undefined>;

  if (googleError) {
    redirectWithError("Google sign-in was cancelled.");
    return;
  }

  const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });

  if (!code || !state || !expectedState || state !== expectedState) {
    redirectWithError("Google sign-in session expired — please try again.");
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
          .set({ googleId: profile.googleId, avatarUrl: profile.picture ?? existing.avatarUrl })
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
        })
        .returning();
    }

    const token = signSession({ userId: user.id, email: user.email });
    res.cookie(SESSION_COOKIE, token, cookieOptions);
    redirectHome();
  } catch (err) {
    console.error("Google sign-in failed:", err);
    redirectWithError("Google sign-in failed — please try again.");
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
    .select({ email: usersTable.email, fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user) {
    res.status(401).json({ error: "Account no longer exists" });
    return;
  }

  res.json(user);
});

export default router;
