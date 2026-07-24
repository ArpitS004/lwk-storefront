import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, newsletterSubscriptionsTable } from "../db";
import { SubscribeNewsletterBody, SubscribeNewsletterResponse } from "../api-zod";

const router: IRouter = Router();

router.post("/newsletter", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(newsletterSubscriptionsTable)
    .where(eq(newsletterSubscriptionsTable.email, parsed.data.email));

  if (existing) {
    res.status(201).json(SubscribeNewsletterResponse.parse(existing));
    return;
  }

  const [subscription] = await db
    .insert(newsletterSubscriptionsTable)
    .values({ email: parsed.data.email })
    .returning();

  res.status(201).json(SubscribeNewsletterResponse.parse(subscription));
});

export default router;
