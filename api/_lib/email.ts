import { Resend } from "resend";
import type { Order, OrderLineItem } from "./db/index.js";

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "LWK <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function formatInr(amount: number): string {
  return `\u20b9${amount.toLocaleString("en-IN")}`;
}

/**
 * Sends the order confirmation email. Silently no-ops (with a console
 * warning) if RESEND_API_KEY isn't set, so local dev / demos without an
 * email provider configured don't crash checkout.
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping confirmation email for ${order.orderNumber}`);
    return;
  }

  const itemsHtml = order.items
    .map(
      (item: OrderLineItem) => `
        <tr>
          <td style="padding:8px 0;">${item.name} (${item.color} / ${item.size}) x${item.quantity}</td>
          <td style="padding:8px 0; text-align:right;">${formatInr(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  await resend.emails.send({
    from: fromAddress,
    to: order.email,
    subject: `Your LWK order ${order.orderNumber} is confirmed`,
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:0 auto; color:#111;">
        <h1 style="font-size:20px; letter-spacing:0.05em; text-transform:uppercase;">Order Confirmed</h1>
        <p>Thanks for your order — here's the confirmation for <strong>${order.orderNumber}</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
          ${itemsHtml}
          <tr>
            <td style="padding-top:12px; border-top:1px solid #ddd; font-weight:bold;">Total</td>
            <td style="padding-top:12px; border-top:1px solid #ddd; text-align:right; font-weight:bold;">${formatInr(order.total)}</td>
          </tr>
        </table>
        <p style="font-size:13px; color:#555;">
          Shipping to: ${order.shippingAddress.fullName}, ${order.shippingAddress.line1},
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
        </p>
        <p style="font-size:12px; color:#999; margin-top:24px;">LWK &mdash; Lowkey. Always.</p>
      </div>
    `,
  });
}

/**
 * Cart abandonment reminder. In production this would be triggered by a
 * scheduled job (e.g. Vercel Cron) checking for carts with no completed
 * order after N minutes. For now it's triggered manually via
 * POST /automations/abandoned-cart for demo purposes.
 */
export async function sendCartAbandonmentEmail(
  email: string,
  items: { name: string; image: string }[]
): Promise<void> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping cart abandonment email for ${email}`);
    return;
  }

  const itemNames = items.map((i) => i.name).join(", ");

  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: "Your fit is still waiting.",
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:0 auto; color:#111;">
        <h1 style="font-size:20px; letter-spacing:0.05em; text-transform:uppercase;">Still thinking it over?</h1>
        <p>You left ${itemNames} in your cart. It's still there whenever you're ready.</p>
        <p style="font-size:12px; color:#999; margin-top:24px;">LWK &mdash; Lowkey. Always.</p>
      </div>
    `,
  });
}
