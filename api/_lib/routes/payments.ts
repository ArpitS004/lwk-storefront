import { Router } from "express";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { db, ordersTable } from "../db/index.js";
import { CreateOrderBody } from "../api-zod/index.js";
import { sendOrderConfirmationEmail } from "../email.js";

const router = Router();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Don't crash the whole API if Razorpay isn't configured yet — just
// disable these two routes until RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
// are set (e.g. once the business bank account + Razorpay account exist).
const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

const CreatePaymentOrderBody = z.object({
  amount: z.number().positive(),
});

router.post("/payments/create-order", async (req, res): Promise<void> => {
  if (!razorpay) {
    res.status(503).json({ error: "Payments are not configured yet" });
    return;
  }

  const parsed = CreatePaymentOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const amountInPaise = Math.round(parsed.data.amount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `lwk_${Date.now()}`,
  });

  res.status(201).json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId,
  });
});

const VerifyPaymentBody = CreateOrderBody.extend({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

function generateOrderNumber(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LWK-${Date.now().toString(36).toUpperCase()}${random}`;
}

router.post("/payments/verify", async (req, res): Promise<void> => {
  if (!keySecret) {
    res.status(503).json({ error: "Payments are not configured yet" });
    return;
  }

  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, ...orderData } = parsed.data;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    res.status(400).json({ error: "Payment verification failed" });
    return;
  }

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      email: orderData.email,
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      tax: orderData.tax,
      total: orderData.total,
      giftNote: orderData.giftNote ?? null,
      status: "paid",
      paymentId: razorpayPaymentId,
      razorpayOrderId,
    })
    .returning();

  sendOrderConfirmationEmail(order).catch((err) => {
    console.error("Failed to send order confirmation email:", err);
  });

  res.status(201).json(order);
});

export default router;
