import { Router } from "express";
import { db, contactMessagesTable } from "../db/index.js";
import { SubmitContactMessageBody, SubmitContactMessageResponse } from "../api-zod/index.js";

const router = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [message] = await db.insert(contactMessagesTable).values(parsed.data).returning();

  res.status(201).json(SubmitContactMessageResponse.parse(message));
});

export default router;
