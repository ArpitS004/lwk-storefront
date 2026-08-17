import { Resend } from "resend";
import type { Order } from "./db/index.js";
import { cartAbandonmentHtml, orderConfirmationHtml, type EmailProduct } from "./email-templates.js";

const resendApiKey = process.env.RESEND_API_KEY;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FALLBACK_FROM = "LWK <onboarding@resend.dev>";

/**
 * Resolves the sender address, defensively.
 *
 * A single invisible character in RESEND_FROM_EMAIL — a non-breaking space
 * pasted from a document, a trailing newline — makes Resend reject every
 * send with "Invalid `from` field", which is exactly what silently blocked
 * every email this app ever tried to send. So: normalise the whitespace,
 * validate the shape, and fall back to a known-good literal rather than
 * trusting the environment.
 */
function resolveFromAddress(): string {
  const raw = process.env.RESEND_FROM_EMAIL;
  if (!raw) return FALLBACK_FROM;

  const cleaned = raw
    // Any Unicode whitespace (incl. U+00A0 non-breaking space) → plain space
    .replace(/\s+/gu, " ")
    // Smart quotes and fullwidth angle brackets sometimes survive a paste
    .replace(/[‘’“”]/g, "")
    .replace(/＜/g, "<")
    .replace(/＞/g, ">")
    .trim();

  // Accept either "email@example.com" or "Name <email@example.com>".
  const bare = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const named = /^[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/;

  if (bare.test(cleaned) || named.test(cleaned)) return cleaned;

  console.warn(
    `RESEND_FROM_EMAIL is not a valid sender address (${JSON.stringify(raw)}) — ` +
      `falling back to ${FALLBACK_FROM}. Expected "email@example.com" or "Name <email@example.com>".`,
  );
  return FALLBACK_FROM;
}

const fromAddress = resolveFromAddress();

/**
 * Order confirmation. Transactional, so it is not gated on marketing
 * consent and carries no unsubscribe link.
 *
 * No-ops with a warning when RESEND_API_KEY is unset so local dev and
 * demos without an email provider don't crash checkout. Note that this
 * means the caller sees success — check the logs, not the response, to
 * confirm mail actually went out.
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping confirmation email for ${order.orderNumber}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: order.email,
    subject: `Your LWK order ${order.orderNumber} is confirmed`,
    html: orderConfirmationHtml(order),
  });

  if (error) {
    throw new Error(`Resend rejected order confirmation email: ${error.message}`);
  }
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
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping cart abandonment email for ${email}`);
    return;
  }

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

  const { error } = await resend.emails.send({
    from: fromAddress,
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

  if (error) {
    throw new Error(`Resend rejected cart abandonment email: ${error.message}`);
  }
}
