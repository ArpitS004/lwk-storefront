import { Router, type Request } from "express";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db, eventsTable, productsTable, cartAbandonmentEmailsTable } from "../db/index.js";
import { sendCartAbandonmentEmail } from "../email.js";
import { generateAbandonmentNudge } from "../deepseek.js";

const router = Router();

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
// How long a cart has to sit untouched, with no purchase, before we nudge.
// Defaults to the real 30 minutes; override with a short value (e.g. "2")
// for a live demo so the automated send is actually visible.
const THRESHOLD_MINUTES = Number(process.env.ABANDONMENT_THRESHOLD_MINUTES) || 30;
// Don't re-notify the same email more than once in this window, and don't
// consider add-to-cart activity older than this at all (avoids emailing
// about a cart from a week ago that was just never followed up on).
const LOOKBACK_HOURS = 24;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow it through (e.g. local dev) but this
  // should always be set once a real external scheduler is wired up.
  if (!secret) return true;
  const header = req.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Automated abandoned-cart check. Meant to be hit on a schedule by an
 * external scheduler (Vercel Hobby's Cron only fires once/day, too slow for
 * this) — see cron-job.org setup. For each logged-in visitor whose most
 * recent cart activity is older than the threshold, with no purchase since
 * and no reminder already sent recently, sends one AI-personalized nudge.
 */
router.post("/cart-abandonment/check", async (req, res): Promise<void> => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const now = Date.now();
  const thresholdCutoff = new Date(now - THRESHOLD_MINUTES * MINUTE_MS);
  const lookbackCutoff = new Date(now - LOOKBACK_HOURS * HOUR_MS);
  const resentCutoff = new Date(now - LOOKBACK_HOURS * HOUR_MS);

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
        gt(eventsTable.createdAt, lookbackCutoff)
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

  const candidates = cartActivity.filter((row) => {
    const email = row.email as string;
    const lastAddToCart = new Date(row.lastAddToCart);

    if (lastAddToCart > thresholdCutoff) return false; // still actively shopping, too soon
    const lastPurchase = lastPurchaseByEmail.get(email);
    if (lastPurchase && lastPurchase >= lastAddToCart) return false; // already bought since
    if (recentlySentEmails.has(email)) return false; // already nudged recently

    return true;
  });

  const results: { email: string; sent: boolean; error?: string }[] = [];

  for (const candidate of candidates) {
    const email = candidate.email as string;

    try {
      // Pull the actual items still sitting in their most recent cart
      // activity, most recent add first, deduped by product.
      const recentAdds = await db
        .select({ payload: eventsTable.payload })
        .from(eventsTable)
        .where(and(eq(eventsTable.type, "add_to_cart"), eq(eventsTable.email, email), gt(eventsTable.createdAt, lookbackCutoff)))
        .orderBy(desc(eventsTable.createdAt))
        .limit(20);

      const seenSlugs = new Set<string>();
      const cartItems: { name: string; slug: string }[] = [];
      for (const row of recentAdds) {
        const slug = row.payload?.slug as string | undefined;
        const name = row.payload?.name as string | undefined;
        if (!slug || !name || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        cartItems.push({ name, slug });
      }

      if (cartItems.length === 0) {
        results.push({ email, sent: false, error: "No resolvable cart items" });
        continue;
      }

      // Look up a real product image for each item rather than trusting
      // whatever (possibly stale) image path the client sent, if any.
      const itemsWithImages = await Promise.all(
        cartItems.map(async (item) => {
          const [product] = await db
            .select({ images: productsTable.images })
            .from(productsTable)
            .where(eq(productsTable.slug, item.slug));
          return { name: item.name, image: product?.images?.[0] ?? "" };
        })
      );

      const message = await generateAbandonmentNudge(itemsWithImages);
      await sendCartAbandonmentEmail(email, itemsWithImages, message);

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

  res.status(200).json({ checked: cartActivity.length, candidates: candidates.length, results });
});

export default router;
