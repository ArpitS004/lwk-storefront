import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, ordersTable } from "../db/index.js";
import { requireAuth } from "../middleware/require-admin.js";
import type { SessionPayload } from "../auth.js";

const router = Router();

/**
 * The signed-in customer's own order history.
 *
 * Scoped by the email on the verified session, never by an email supplied
 * in the request — otherwise this would be an open lookup of anyone's
 * orders and shipping addresses.
 */
router.get("/account/orders", requireAuth, async (_req, res): Promise<void> => {
  const session = res.locals.session as SessionPayload;

  const orders = await db
    .select({
      orderNumber: ordersTable.orderNumber,
      items: ordersTable.items,
      subtotal: ordersTable.subtotal,
      shipping: ordersTable.shipping,
      tax: ordersTable.tax,
      total: ordersTable.total,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .where(eq(ordersTable.email, session.email))
    .orderBy(desc(ordersTable.createdAt))
    .limit(50);

  res.json({ orders });
});

export default router;
