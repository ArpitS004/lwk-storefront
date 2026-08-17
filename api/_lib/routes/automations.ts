import { Router } from "express";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, productsTable, usersTable } from "../db/index.js";
import { sendCartAbandonmentEmail } from "../email.js";
import { generateAbandonmentNudge } from "../deepseek.js";
import { requireAdmin } from "../middleware/require-admin.js";

const router = Router();

// In production this flow is triggered by a scheduled job (see
// routes/cart-abandonment.ts). Waiting real minutes isn't practical for a
// demo, so this endpoint fires the same email on demand — identical
// content, identical send path, identical consent gate.
//
// Admin-only. Unauthenticated, this was an open relay: any caller could
// send mail from our Resend account to any address.
const TriggerAbandonedCartBody = z.object({
  email: z.string().email(),
  // Optional. Products are resolved from the catalogue so the email
  // contains real photos, real prices and working links. Omit to use the
  // first couple of in-stock products.
  slugs: z.array(z.string()).max(5).optional(),
  // Accepted and ignored, so an older cached frontend build still works.
  items: z.unknown().optional(),
});

router.post("/automations/abandoned-cart", requireAdmin, async (req, res): Promise<void> => {
  const parsed = TriggerAbandonedCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  // Consent gate applies to the demo button too. A demo path that can
  // bypass opt-in is a path that will eventually be used to bypass opt-in.
  const [recipient] = await db
    .select({
      marketingConsent: usersTable.marketingConsent,
      unsubscribeToken: usersTable.unsubscribeToken,
    })
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!recipient) {
    res.status(404).json({
      error: `No LWK account exists for ${parsed.data.email}. Marketing email can only be sent to a registered account that has opted in.`,
    });
    return;
  }

  if (!recipient.marketingConsent || !recipient.unsubscribeToken) {
    res.status(403).json({
      error: `${parsed.data.email} has not opted in to marketing email. Turn it on from that account's page (/account), then try again.`,
    });
    return;
  }

  // Real catalogue data — the email renders product cards, so placeholder
  // names with no matching product would render as broken images.
  const products = parsed.data.slugs?.length
    ? await db
        .select({
          name: productsTable.name,
          images: productsTable.images,
          price: productsTable.price,
          slug: productsTable.slug,
        })
        .from(productsTable)
        .where(inArray(productsTable.slug, parsed.data.slugs))
    : await db
        .select({
          name: productsTable.name,
          images: productsTable.images,
          price: productsTable.price,
          slug: productsTable.slug,
        })
        .from(productsTable)
        .where(eq(productsTable.inStock, true))
        .orderBy(asc(productsTable.id))
        .limit(2);

  if (products.length === 0) {
    res.status(404).json({ error: "No products found to build the email from." });
    return;
  }

  const items = products.map((p) => ({
    name: p.name,
    image: p.images?.[0] ?? "",
    price: p.price,
    slug: p.slug,
  }));

  try {
    const message = await generateAbandonmentNudge(items);
    await sendCartAbandonmentEmail(
      parsed.data.email,
      items,
      message,
      recipient.unsubscribeToken,
    );
  } catch (err) {
    console.error("Failed to send cart abandonment email:", err);
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to send email" });
    return;
  }

  res.status(200).json({
    sent: true,
    // Echoed back so the dashboard can show what actually went out.
    items: items.map((i) => i.name),
  });
});

export default router;
