import { Router } from "express";
import { z } from "zod";
import { db, eventsTable, EVENT_TYPES } from "../db/index.js";
import { verifySession, SESSION_COOKIE } from "../auth.js";

const router = Router();

const TrackEventBody = z.object({
  visitorId: z.string().min(1),
  type: z.enum(EVENT_TYPES),
  payload: z.record(z.string(), z.unknown()).optional(),
  path: z.string().optional(),
  referrer: z.string().optional(),
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = TrackEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Derived server-side from the session cookie, never trusted from the
  // client body — this is what lets us target abandoned-cart emails to a
  // real identity as soon as someone who's logged in adds something to
  // their cart, not just at checkout.
  const token = req.cookies?.[SESSION_COOKIE];
  const session = token ? verifySession(token) : null;

  await db.insert(eventsTable).values({
    visitorId: parsed.data.visitorId,
    type: parsed.data.type,
    payload: parsed.data.payload ?? {},
    path: parsed.data.path ?? null,
    referrer: parsed.data.referrer ?? null,
    email: session?.email ?? null,
  });

  // 204: the client doesn't need a response body for a tracking beacon.
  res.status(204).end();
});

export default router;
