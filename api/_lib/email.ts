import type { Order } from "./db/index.js";
import { cartAbandonmentHtml, orderConfirmationHtml, type EmailProduct } from "./email-templates.js";
import { sendMail } from "./mailer.js";

/**
 * Order confirmation. Transactional, so it is not gated on marketing
 * consent and carries no unsubscribe link.
 *
 * If no email provider is configured this logs a warning and returns
 * without sending, so local dev and demos don't crash checkout. That means
 * the caller sees success either way — check the logs, not the response, to
 * confirm mail actually went out.
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  await sendMail({
    to: order.email,
    subject: `Your LWK order ${order.orderNumber} is confirmed`,
    html: orderConfirmationHtml(order),
  });
}

/**
 * Abandoned-cart reminder. Marketing, so it requires recorded consent and
 * must carry a working one-click opt-out.
 *
 * Triggered automatically by the scheduled check (routes/cart-abandonment.ts)
 * or manually from the admin dashboard. `message` is the AI-personalised
 * body copy (see generateAbandonmentNudge); the product photos, prices and
 * links come from real catalogue data.
 */
export async function sendCartAbandonmentEmail(
  email: string,
  items: EmailProduct[],
  message?: string,
  unsubscribeToken?: string,
): Promise<void> {
  // Refuse rather than put marketing in someone's inbox with no way out.
  if (!unsubscribeToken) {
    throw new Error(
      `Refusing to send marketing email to ${email} without an unsubscribe token.`,
    );
  }

  const itemNames = items.map((i) => i.name).join(", ");
  const body =
    message ?? `You left ${itemNames} in your cart. It's still there whenever you're ready.`;

  const baseUrl = (process.env.APP_BASE_URL ?? "").replace(/\/$/, "");
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${unsubscribeToken}`;

  await sendMail({
    to: email,
    subject: "Your fit is still waiting.",
    // Gives Gmail and Outlook a native "Unsubscribe" control beside the
    // sender name, which measurably reduces spam complaints.
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    html: cartAbandonmentHtml({ items, message: body, unsubscribeUrl }),
  });
}
