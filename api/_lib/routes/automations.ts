import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "../db/index.js";
import { sendCartAbandonmentEmail } from "../email.js";
import { generateAbandonmentNudge } from "../deepseek.js";
import { requireAdmin } from "../middleware/require-admin.js";

const router = Router();

// In production this flow is triggered by a scheduled job (see
// routes/cart-abandonment.ts). For a live demo, waiting real minutes isn't
// practical, so this endpoint fires the same email on demand — identical
// content and send path.
//
// Admin-only. Previously this was unauthenticated, which made it an open
// relay: any caller could send mail from our Resend account to any address.
const TriggerAbandonedCartBody = z.object({
  email: z.string().email(),
  items: z
    .array(
      z.object({
        name: z.string(),
        image: z.string(),
      })
    )
    .min(1),
});

router.post("/automations/abandoned-cart", requireAdmin, async (req, res): Promise<void> => {
  const parsed = TriggerAbandonedCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Even the manual trigger goes through the consent gate. A demo button
  // that can bypass opt-in is a demo button that will eventually be used
  // to bypass opt-in.
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
      error: `${parsed.data.email} has not opted in to marketing email. Enable it from that account's page, then try again.`,
    });
    return;
  }

  try {
    const message = await generateAbandonmentNudge(parsed.data.items);
    await sendCartAbandonmentEmail(
      parsed.data.email,
      parsed.data.items,
      message,
      recipient.unsubscribeToken
    );
  } catch (err) {
    console.error("Failed to send cart abandonment email:", err);
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to send email" });
    return;
  }

  res.status(200).json({ sent: true });
});

export default router;
