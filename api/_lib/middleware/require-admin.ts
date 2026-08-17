import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../db/index.js";
import { verifySession, SESSION_COOKIE } from "../auth.js";

/**
 * Gate for admin-only routes.
 *
 * Checks the database on every request rather than trusting an `isAdmin`
 * claim baked into the JWT. Sessions last 30 days, so a token-embedded
 * claim would keep working for a month after admin rights were revoked.
 * The extra query is cheap and this is a low-traffic surface.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
    .select({ isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user?.isAdmin) {
    // Deliberately 403 with no detail — don't confirm to a probing caller
    // whether the account exists or merely lacks the flag.
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}

/**
 * Resolves the caller's session, or null. For routes that serve a
 * logged-in customer their own data.
 */
export function getSession(req: Request) {
  const token = req.cookies?.[SESSION_COOKIE];
  return token ? verifySession(token) : null;
}

/**
 * Gate for customer-account routes (order history, profile). Attaches the
 * verified session to res.locals for the handler to use.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  res.locals.session = session;
  next();
}
