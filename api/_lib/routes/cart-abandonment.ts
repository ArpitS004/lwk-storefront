import { Router, type Request } from "express";
import { and, desc, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { db, eventsTable, productsTable, usersTable, cartAbandonmentEmailsTable } from "../db/index.js";
import { sendCartAbandonmentEmail } from "../email.js";
import { generateAbandonmentNudge } from "../deepseek.js";
import {
  evaluateAbandonmentEligibility,
  reconcileCart,
  type IneligibleReason,
} from "../abandonment-rules.js";

const router = Router();

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

// How long a cart has to sit untouched, with no purchase, before we nudge.
// Defaults to the real 30 minutes; override with a short value (e.g. "2")
// for a live demo so the automated send is actually visible.
const THRESHOLD_MINUTES = Number(process.env.ABANDONMENT_THRESHOLD_MINUTES) || 30;

// Three distinct windows that happen to share a value today. Kept separate
// so tuning one doesn't silently move the others.
const ACTIVITY_LOOKBACK_HOURS = 24; // ignore cart activity older than this
const RESEND_COOLDOWN_HOURS = 24; // don't nudge the same person again within this
const ITEM_RESOLUTION_HOURS = 24; // how far back to look when rebuilding their cart

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    // Fails CLOSED in production. This endpoint triggers a mass send; if
    // the secret is ever missing or misspelled in the deployment config,
    // refusing every call is the safe failure, not accepting every call.
    if (process.env.NODE_ENV === "production") {
      console.error("CRON_SECRET is not set — refusing to run the abandonment check.");
      return false;
    }
    return true; // local dev convenience only
  }

  const header = req.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Automated abandoned-cart check. Meant to be hit on a schedule by an
 * external scheduler (Vercel Hobby's Cron only fires once/day, too slow for
 * this) — see cron-job.org setup.
 *
 * Sends at most one AI-personalized nudge per person, and only when every
 * one of these deterministic conditions holds:
 *   - they are signed in, so we have a real identity rather than a guess
 *   - they have actively opted in to marketing
 *   - their last cart activity is older than the threshold
 *   - they have not purchased since that activity
 *   - they still have at least one item they didn't subsequently remove
 *   - they haven't already been nudged inside the cooldown window
 *
 * The AI writes the copy. It decides none of the above.
 */
router.post("/cart-abandonment/check", async (req, res): Promise<void> => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const now = Date.now();
  const thresholdCutoff = new Date(now - THRESHOLD_MINUTES * MINUTE_MS);
  const activityCutoff = new Date(now - ACTIVITY_LOOKBACK_HOURS * HOUR_MS);
  const resentCutoff = new Date(now - RESEND_COOLDOWN_HOURS * HOUR_MS);
  const itemCutoff = new Date(now - ITEM_RESOLUTION_HOURS * HOUR_MS);

  // Most recent add_to_cart per email, within the lookback window.
  const cartActivity = await db
    .select({
      email: eventsTable.email,
      lastAddToCart: sql<Date>`max(${eventsTable.createdAt})`.as("last_add_to_cart"),
    })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.type, "add_to_cart"),
        isNotNull(eventsTable.email),
        gt(eventsTable.createdAt, activityCutoff)
      )
    )
    .groupBy(eventsTable.email);

  // Most recent purchase per email (no window — a purchase at any point
  // after the cart activity means it wasn't abandoned).
  const purchases = await db
    .select({
      email: eventsTable.email,
      lastPurchase: sql<Date>`max(${eventsTable.createdAt})`.as("last_purchase"),
    })
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "purchase_completed"), isNotNull(eventsTable.email)))
    .groupBy(eventsTable.email);
  const lastPurchaseByEmail = new Map(purchases.map((p) => [p.email as string, new Date(p.lastPurchase)]));

  // Emails already sent a reminder recently — don't spam.
  const recentSends = await db
    .select({ email: cartAbandonmentEmailsTable.email })
    .from(cartAbandonmentEmailsTable)
    .where(gt(cartAbandonmentEmailsTable.sentAt, resentCutoff));
  const recentlySentEmails = new Set(recentSends.map((r) => r.email));

  // Consent is the hard gate. One query for every candidate, keeping only
  // those who actively opted in AND have an unsubscribe token — no token
  // means no compliant way to send, so they are excluded.
  const candidateEmails = [...new Set(cartActivity.map((r) => r.email).filter((e): e is string => Boolean(e)))];
  const consentByEmail = new Map<string, string>(); // email -> unsubscribeToken

  if (candidateEmails.length > 0) {
    const consenting = await db
      .select({ email: usersTable.email, unsubscribeToken: usersTable.unsubscribeToken })
      .from(usersTable)
      .where(
        and(
          inArray(usersTable.email, candidateEmails),
          eq(usersTable.marketingConsent, true),
          isNotNull(usersTable.unsubscribeToken)
        )
      );
    for (const row of consenting) {
      if (row.unsubscribeToken) consentByEmail.set(row.email, row.unsubscribeToken);
    }
  }

  // Counted so a run that sends nothing reports a reason instead of looking
  // silently broken.
  const skipped: Record<IneligibleReason | "empty_cart", number> = {
    too_soon: 0,
    purchased_since: 0,
    cooldown: 0,
    no_consent: 0,
    empty_cart: 0,
  };

  // The send/don't-send decision lives in abandonment-rules.ts as pure,
  // unit-tested functions. This route only supplies the data.
  const eligibilityContext = {
    now: new Date(now),
    thresholdMinutes: THRESHOLD_MINUTES,
    lastPurchaseByEmail,
    recentlySentEmails,
    consentByEmail,
  };

  const candidates: { email: string; unsubscribeToken: string }[] = [];
  for (const row of cartActivity) {
    const email = row.email;
    if (!email) continue;

    const verdict = evaluateAbandonmentEligibility(
      { email, lastAddToCart: new Date(row.lastAddToCart) },
      eligibilityContext,
    );

    if (verdict.eligible) {
      candidates.push({ email, unsubscribeToken: verdict.unsubscribeToken });
    } else {
      skipped[verdict.reason]++;
    }
  }

  const results: { email: string; sent: boolean; error?: string }[] = [];

  for (const candidate of candidates) {
    const { email, unsubscribeToken } = candidate;

    try {
      // Rebuild what is actually still in their cart. Reading add_to_cart
      // alone would email people about items they deliberately removed, so
      // adds and removes are replayed in chronological order.
      const cartEvents = await db
        .select({
          type: eventsTable.type,
          payload: eventsTable.payload,
        })
        .from(eventsTable)
        .where(
          and(
            eq(eventsTable.email, email),
            gt(eventsTable.createdAt, itemCutoff),
            inArray(eventsTable.type, ["add_to_cart", "remove_from_cart"])
          )
        )
        .orderBy(desc(eventsTable.createdAt))
        .limit(100);

      // Queried newest-first for the LIMIT to keep the most recent
      // activity; reconcileCart needs oldest-first so a later remove
      // cancels an earlier add.
      const cartItems = reconcileCart([...cartEvents].reverse());

      if (cartItems.length === 0) {
        skipped.empty_cart++;
        results.push({ email, sent: false, error: "Cart empty after reconciling removals" });
        continue;
      }

      // Pull image, price and slug from the catalogue rather than trusting
      // whatever the client sent — the email renders real product cards,
      // and a stale price in a marketing email is worse than no price.
      const itemsWithImages = await Promise.all(
        cartItems.map(async (item) => {
          const [product] = await db
            .select({
              images: productsTable.images,
              price: productsTable.price,
              name: productsTable.name,
            })
            .from(productsTable)
            .where(eq(productsTable.slug, item.slug));
          return {
            name: product?.name ?? item.name,
            image: product?.images?.[0] ?? "",
            price: product?.price,
            slug: item.slug,
          };
        })
      );

      const message = await generateAbandonmentNudge(itemsWithImages);
      await sendCartAbandonmentEmail(email, itemsWithImages, message, unsubscribeToken);

      await db.insert(cartAbandonmentEmailsTable).values({
        email,
        items: itemsWithImages,
        message,
      });

      results.push({ email, sent: true });
    } catch (err) {
      console.error(`Failed to send abandoned-cart nudge to ${email}:`, err);
      results.push({ email, sent: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  res.status(200).json({
    checked: cartActivity.length,
    candidates: candidates.length,
    skipped,
    results,
  });
});

export default router;
