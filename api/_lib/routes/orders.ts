import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "../db/index.js";
import { CreateOrderBody, CreateOrderResponse, GetOrderParams, GetOrderResponse } from "../api-zod/index.js";
import { sendOrderConfirmationEmail } from "../email.js";

const router = Router();

function generateOrderNumber(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LWK-${Date.now().toString(36).toUpperCase()}${random}`;
}

// DEMO ORDER CREATION -- no real payment happens here. This exists so
// checkout works end-to-end (and the confirmation email + purchase
// tracking can be demoed) before Razorpay is fully configured. Once
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set, orders should instead be
// created via POST /payments/verify, which only creates an order after a
// real Razorpay payment signature has been verified.
//
// Gated behind ALLOW_UNPAID_ORDERS because, unguarded, this route lets any
// caller create order records and trigger a confirmation email to any
// address. Set it to false the moment real payments go live.
router.post("/orders", async (req, res): Promise<void> => {
  if (process.env.ALLOW_UNPAID_ORDERS !== "true") {
    res.status(403).json({
      error: "Unpaid order creation is disabled. Complete checkout through the payment flow.",
    });
    return;
  }

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

  sendOrderConfirmationEmail(order).catch((err) => {
    console.error("Failed to send order confirmation email:", err);
  });

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
