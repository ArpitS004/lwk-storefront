import { Router } from "express";
import { z } from "zod";
import { sendCartAbandonmentEmail } from "../email.js";

const router = Router();

// In production this flow is triggered by a scheduled job (checking for
// carts abandoned 30min / 24h / 72h ago). For a live demo, waiting real
// minutes isn't practical, so this endpoint lets you fire the same email
// on demand — the email content and send path are identical either way.
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

router.post("/automations/abandoned-cart", async (req, res): Promise<void> => {
  const parsed = TriggerAbandonedCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await sendCartAbandonmentEmail(parsed.data.email, parsed.data.items);
  res.status(200).json({ sent: true });
});

export default router;
