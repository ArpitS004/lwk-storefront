import type { Order, OrderLineItem } from "./db/index.js";

// Email HTML, kept separate from the sending logic in email.ts.
//
// Constraints that drive every choice here, and are not negotiable if the
// mail is to render in real inboxes:
//   - Tables for layout. Gmail, Outlook and most mobile clients strip or
//     ignore flexbox and grid.
//   - Every style inline. There is no reliable <style> support, and Gmail
//     drops <head> entirely.
//   - Absolute image URLs. A src of "/catalog/products/x.jpg" resolves
//     against the mail client's own host and shows a broken image, which is
//     exactly why the previous template rendered no product photos.
//   - Fixed pixel widths, 600px outer. Percentage widths break in Outlook.
//   - No web fonts. They silently fall back, so pick a stack that reads
//     well everywhere.

const BRAND = {
  ink: "#0f0f0f",
  paper: "#ffffff",
  bone: "#f6f4f1",
  border: "#e4e1dc",
  muted: "#7a7570",
  accent: "#b02832",
} as const;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export interface EmailProduct {
  name: string;
  image: string;
  price?: number;
  slug?: string;
}

function baseUrl(): string {
  return (process.env.APP_BASE_URL ?? "https://lwk-storefront-d4s2.vercel.app").replace(/\/$/, "");
}

/** Turns a stored relative image path into a URL a mail client can load. */
function absoluteImage(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Black masthead with the wordmark, shared by every LWK email. */
function header(): string {
  return `
  <tr>
    <td style="background:${BRAND.ink};padding:28px 32px;text-align:center;">
      <div style="font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:0.14em;color:#ffffff;text-transform:uppercase;">
        LWK<span style="color:${BRAND.accent};">*</span>
      </div>
      <div style="font-family:${FONT};font-size:9px;letter-spacing:0.24em;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-top:7px;">
        Lowkey. Always.
      </div>
    </td>
  </tr>`;
}

function footer(unsubscribeUrl?: string): string {
  return `
  <tr>
    <td style="background:${BRAND.bone};padding:28px 32px;text-align:center;border-top:1px solid ${BRAND.border};">
      <div style="font-family:${FONT};font-size:10px;letter-spacing:0.2em;color:${BRAND.muted};text-transform:uppercase;">
        LWK &mdash; Estd. 2026
      </div>
      <div style="font-family:${FONT};font-size:11px;color:${BRAND.muted};margin-top:14px;line-height:1.7;">
        <a href="${baseUrl()}/shop" style="color:${BRAND.muted};text-decoration:underline;">Shop</a>
        &nbsp;&middot;&nbsp;
        <a href="${baseUrl()}/contact" style="color:${BRAND.muted};text-decoration:underline;">Contact</a>
        &nbsp;&middot;&nbsp;
        <a href="${baseUrl()}/shipping-returns" style="color:${BRAND.muted};text-decoration:underline;">Shipping &amp; Returns</a>
      </div>
      ${
        unsubscribeUrl
          ? `<div style="font-family:${FONT};font-size:11px;color:${BRAND.muted};margin-top:18px;line-height:1.6;">
               You're receiving this because you opted in to LWK emails.<br>
               <a href="${unsubscribeUrl}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>
             </div>`
          : `<div style="font-family:${FONT};font-size:11px;color:${BRAND.muted};margin-top:18px;">
               This is a transactional message about your order.
             </div>`
      }
    </td>
  </tr>`;
}

/** Full-width dark button. Table-wrapped so Outlook renders the background. */
function button(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" bgcolor="${BRAND.ink}" style="border-radius:2px;">
        <a href="${href}"
           style="display:inline-block;padding:16px 44px;font-family:${FONT};font-size:11px;font-weight:600;
                  letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/** One product row: photo, name, price, and a link through to its page. */
function productRow(item: EmailProduct, isLast: boolean): string {
  const img = absoluteImage(item.image);
  const href = item.slug ? `${baseUrl()}/products/${item.slug}` : `${baseUrl()}/shop`;

  return `
  <tr>
    <td style="padding:18px 0;${isLast ? "" : `border-bottom:1px solid ${BRAND.border};`}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="96" valign="top" style="width:96px;">
            <a href="${href}" style="text-decoration:none;">
              ${
                img
                  ? `<img src="${img}" alt="${escapeHtml(item.name)}" width="96" height="120"
                        style="display:block;width:96px;height:120px;object-fit:cover;border:1px solid ${BRAND.border};background:${BRAND.bone};" />`
                  : `<div style="width:96px;height:120px;background:${BRAND.bone};border:1px solid ${BRAND.border};"></div>`
              }
            </a>
          </td>
          <td valign="top" style="padding-left:18px;">
            <a href="${href}" style="text-decoration:none;">
              <div style="font-family:${FONT};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.ink};line-height:1.5;">
                ${escapeHtml(item.name)}
              </div>
            </a>
            ${
              item.price !== undefined
                ? `<div style="font-family:${FONT};font-size:14px;color:${BRAND.ink};margin-top:8px;">${formatInr(item.price)}</div>`
                : ""
            }
            <a href="${href}"
               style="display:inline-block;margin-top:12px;font-family:${FONT};font-size:10px;letter-spacing:0.16em;
                      text-transform:uppercase;color:${BRAND.muted};text-decoration:none;border-bottom:1px solid ${BRAND.border};padding-bottom:3px;">
              View
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function shell(inner: string, unsubscribeUrl?: string, preheader?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background:${BRAND.bone};">
  ${
    preheader
      ? `<div style="display:none;font-size:1px;color:${BRAND.bone};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
      : ""
  }
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.bone};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
               style="width:600px;max-width:600px;background:${BRAND.paper};border:1px solid ${BRAND.border};">
          ${header()}
          ${inner}
          ${footer(unsubscribeUrl)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Abandoned-cart nudge. `message` is the AI-written body copy; the product
 * photos, prices and links are all rendered from real catalogue data.
 */
export function cartAbandonmentHtml(opts: {
  items: EmailProduct[];
  message: string;
  unsubscribeUrl: string;
}): string {
  const rows = opts.items
    .map((item, i) => productRow(item, i === opts.items.length - 1))
    .join("");

  const subtotal = opts.items.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const hasPrices = opts.items.some((i) => i.price !== undefined);

  const inner = `
  <tr>
    <td style="padding:40px 32px 8px;">
      <div style="font-family:${FONT};font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.accent};">
        Still in your cart
      </div>
      <h1 style="margin:14px 0 0;font-family:${FONT};font-size:26px;line-height:1.25;letter-spacing:-0.02em;color:${BRAND.ink};font-weight:600;">
        You left something behind.
      </h1>
      <p style="margin:16px 0 0;font-family:${FONT};font-size:15px;line-height:1.65;color:#3d3a37;">
        ${escapeHtml(opts.message)}
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
             style="border-top:1px solid ${BRAND.border};">
        ${rows}
      </table>
    </td>
  </tr>

  ${
    hasPrices
      ? `<tr>
           <td style="padding:18px 32px 0;">
             <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
               <tr>
                 <td style="font-family:${FONT};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.muted};">
                   Subtotal
                 </td>
                 <td align="right" style="font-family:${FONT};font-size:15px;color:${BRAND.ink};">
                   ${formatInr(subtotal)}
                 </td>
               </tr>
             </table>
           </td>
         </tr>`
      : ""
  }

  <tr>
    <td style="padding:32px;">
      ${button("Finish checking out", `${baseUrl()}/checkout`)}
      <p style="margin:20px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
        Free shipping on orders over &#8377;1,999.
      </p>
    </td>
  </tr>`;

  return shell(
    inner,
    opts.unsubscribeUrl,
    `${opts.items.map((i) => i.name).join(", ")} — still waiting in your cart.`,
  );
}

/** Order confirmation. Transactional, so no unsubscribe footer. */
export function orderConfirmationHtml(order: Order): string {
  const rows = order.items
    .map(
      (item: OrderLineItem, i: number) => `
  <tr>
    <td style="padding:18px 0;${i === order.items.length - 1 ? "" : `border-bottom:1px solid ${BRAND.border};`}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="80" valign="top" style="width:80px;">
            ${
              item.image
                ? `<img src="${absoluteImage(item.image)}" alt="${escapeHtml(item.name)}" width="80" height="100"
                      style="display:block;width:80px;height:100px;object-fit:cover;border:1px solid ${BRAND.border};background:${BRAND.bone};" />`
                : `<div style="width:80px;height:100px;background:${BRAND.bone};border:1px solid ${BRAND.border};"></div>`
            }
          </td>
          <td valign="top" style="padding-left:16px;">
            <div style="font-family:${FONT};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.ink};line-height:1.5;">
              ${escapeHtml(item.name)}
            </div>
            <div style="font-family:${FONT};font-size:11px;text-transform:uppercase;color:${BRAND.muted};margin-top:6px;letter-spacing:0.06em;">
              ${escapeHtml(item.color)} / ${escapeHtml(item.size)} &nbsp;&middot;&nbsp; Qty ${item.quantity}
            </div>
          </td>
          <td valign="top" align="right" style="font-family:${FONT};font-size:13px;color:${BRAND.ink};white-space:nowrap;">
            ${formatInr(item.price * item.quantity)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
    )
    .join("");

  const totalLine = (label: string, value: string, bold = false) => `
  <tr>
    <td style="font-family:${FONT};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${bold ? BRAND.ink : BRAND.muted};padding:7px 0;${bold ? `border-top:1px solid ${BRAND.border};padding-top:14px;font-weight:600;` : ""}">
      ${label}
    </td>
    <td align="right" style="font-family:${FONT};font-size:${bold ? "16px" : "13px"};color:${BRAND.ink};padding:7px 0;${bold ? `border-top:1px solid ${BRAND.border};padding-top:14px;font-weight:600;` : ""}">
      ${value}
    </td>
  </tr>`;

  const addr = order.shippingAddress;

  const inner = `
  <tr>
    <td style="padding:40px 32px 8px;">
      <div style="font-family:${FONT};font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.accent};">
        Order confirmed
      </div>
      <h1 style="margin:14px 0 0;font-family:${FONT};font-size:26px;line-height:1.25;letter-spacing:-0.02em;color:${BRAND.ink};font-weight:600;">
        Thanks for your order.
      </h1>
      <p style="margin:16px 0 0;font-family:${FONT};font-size:14px;line-height:1.65;color:#3d3a37;">
        We're getting it ready. Your order number is
        <strong style="font-family:${FONT};letter-spacing:0.04em;">${escapeHtml(order.orderNumber)}</strong>.
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.border};">
        ${rows}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:18px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${totalLine("Subtotal", formatInr(order.subtotal))}
        ${totalLine("Shipping", order.shipping === 0 ? "Free" : formatInr(order.shipping))}
        ${totalLine("GST", formatInr(order.tax))}
        ${totalLine("Total", formatInr(order.total), true)}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 0;">
      <div style="background:${BRAND.bone};border:1px solid ${BRAND.border};padding:20px;">
        <div style="font-family:${FONT};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};">
          Shipping to
        </div>
        <div style="font-family:${FONT};font-size:13px;line-height:1.7;color:${BRAND.ink};margin-top:10px;">
          ${escapeHtml(addr.fullName)}<br>
          ${escapeHtml(addr.line1)}${addr.line2 ? `<br>${escapeHtml(addr.line2)}` : ""}<br>
          ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.postalCode)}<br>
          ${escapeHtml(addr.country)}
        </div>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding:32px;">
      ${button("View your order", `${baseUrl()}/order-confirmation/${encodeURIComponent(order.orderNumber)}`)}
    </td>
  </tr>`;

  return shell(inner, undefined, `Order ${order.orderNumber} confirmed — thanks for your order.`);
}
