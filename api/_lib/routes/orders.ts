import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "../db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
} from "../api-zod";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LWK-${Date.now().toString(36).toUpperCase()}${random}`;
}

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      email: parsed.data.email,
      items: parsed.data.items,
      shippingAddress: parsed.data.shippingAddress,
      subtotal: parsed.data.subtotal,
      shipping: parsed.data.shipping,
      tax: parsed.data.tax,
      total: parsed.data.total,
      giftNote: parsed.data.giftNote ?? null,
      status: "placed",
    })
    .returning();

  res.status(201).json(CreateOrderResponse.parse(order));
});

router.get("/orders/:orderNumber", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, params.data.orderNumber));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(order));
});

export default router;
