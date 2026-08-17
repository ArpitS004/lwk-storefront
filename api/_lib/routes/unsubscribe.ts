import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../db/index.js";

const router = Router();

/**
 * One-click unsubscribe. Deliberately a plain GET with no login required —
 * the whole point is that someone who no longer wants our email can stop it
 * in a single click from the email itself, without remembering a password.
 *
 * The token is 24 random bytes and identifies exactly one account, so
 * possession of the link is the authorisation. The only thing it can do is
 * turn marketing off, which is a strictly safe direction: worst case, an
 * attacker who somehow obtained a token stops us from marketing to someone.
 * Turning consent back ON requires a real login (PATCH /auth/consent).
 */
router.get("/unsubscribe/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  const page = (title: string, body: string) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — LWK</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#f5f5f5;
       display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{max-width:420px;text-align:center}
  h1{font-size:18px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 16px}
  p{color:#a3a3a3;line-height:1.6;font-size:14px;margin:0 0 24px}
  a{color:#f5f5f5;font-size:12px;letter-spacing:.18em;text-transform:uppercase;
    text-decoration:none;border-bottom:1px solid #f5f5f5;padding-bottom:4px}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p>
<a href="/">Return to LWK</a></div></body></html>`;

  if (!token || token.length < 16) {
    res.status(400).type("html").send(page("Invalid link", "That unsubscribe link doesn't look right."));
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ marketingConsent: false, consentUpdatedAt: new Date() })
    .where(eq(usersTable.unsubscribeToken, token))
    .returning({ email: usersTable.email });

  if (!user) {
    // Same page whether the token is unknown or already used — don't turn
    // this into an oracle for guessing valid tokens.
    res
      .status(404)
      .type("html")
      .send(page("Link not recognised", "This unsubscribe link is no longer valid. If you're still receiving email you don't want, reply to any message and we'll sort it out."));
    return;
  }

  res.type("html").send(
    page(
      "You're unsubscribed",
      "You won't receive any more marketing email from LWK. Order confirmations and delivery updates will still be sent, since those relate to purchases you've made.",
    ),
  );
});

export default router;
