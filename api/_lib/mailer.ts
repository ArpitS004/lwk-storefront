import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";

// Single send path for the whole app, with two interchangeable providers.
//
// WHY TWO:
//
// Resend is the better long-term choice — real deliverability tooling, open
// and click tracking, a proper dashboard. But its shared test sender
// (onboarding@resend.dev) will only deliver to the address that owns the
// Resend account, so until a domain is bought and verified, no customer can
// receive anything.
//
// Gmail SMTP closes that gap for free. The crucial difference from "sending
// as a Gmail address through an email service" — which Gmail and Yahoo have
// rejected since February 2024 — is that here Google itself is the sender.
// The message is authenticated by Google and signed with gmail.com's own
// DKIM key, so SPF, DKIM and DMARC all pass and it lands in real inboxes.
//
// The trade-offs are real and worth stating:
//   - 500 recipients per day on a free Gmail account.
//   - The From address is a personal Gmail, not a brand address.
//   - Google discourages bulk marketing from personal accounts. At a few
//     abandoned carts a day this looks like ordinary use; at thousands it
//     does not, and the account can be throttled.
//
// So: Gmail SMTP to get running for nothing, Resend with a verified domain
// once there is a domain to verify. Swapping back is one env var.

export type MailProvider = "gmail" | "resend" | "none";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

const FALLBACK_FROM = "LWK <onboarding@resend.dev>";

/**
 * Normalises and validates a sender address.
 *
 * A single invisible character here — a non-breaking space pasted from a
 * document, a trailing newline — makes the provider reject every send with
 * "Invalid `from` field", which is exactly what silently blocked every
 * email this app ever tried to send. So clean the whitespace, check the
 * shape, and fall back to a known-good literal rather than trusting the
 * environment.
 */
export function normaliseFromAddress(raw: string | undefined, fallback = FALLBACK_FROM): string {
  if (!raw) return fallback;

  const cleaned = raw
    .replace(/\s+/gu, " ") // any Unicode whitespace, incl. U+00A0, becomes a plain space
    .replace(/[‘’“”]/g, "") // smart quotes survive pastes
    .replace(/＜/g, "<")
    .replace(/＞/g, ">")
    .trim();

  const bare = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const named = /^[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/;

  if (bare.test(cleaned) || named.test(cleaned)) return cleaned;

  console.warn(
    `Sender address is not valid (${JSON.stringify(raw)}) — falling back to ${fallback}. ` +
      `Expected "email@example.com" or "Name <email@example.com>".`,
  );
  return fallback;
}

/**
 * Which provider is active, given the current configuration.
 *
 * Gmail wins when configured, because the only reason to configure it is
 * that Resend cannot yet reach real customers.
 */
export function resolveProvider(env: NodeJS.ProcessEnv = process.env): MailProvider {
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) return "gmail";
  if (env.RESEND_API_KEY) return "resend";
  return "none";
}

/** The From address for the active provider. */
export function resolveFrom(env: NodeJS.ProcessEnv = process.env): string {
  const provider = resolveProvider(env);

  if (provider === "gmail") {
    // Gmail rewrites From to the authenticated account anyway, so the only
    // part we control is the display name. Keep it branded.
    const name = env.GMAIL_FROM_NAME?.trim() || "LWK";
    return normaliseFromAddress(`${name} <${env.GMAIL_USER}>`, `LWK <${env.GMAIL_USER}>`);
  }

  return normaliseFromAddress(env.RESEND_FROM_EMAIL);
}

let resendClient: Resend | null = null;
let smtpTransport: Transporter | null = null;

function getResend(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY as string);
  return resendClient;
}

function getSmtp(): Transporter {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        // A Google App Password, not the account password. Requires
        // 2-step verification on the account.
        pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""),
      },
    });
  }
  return smtpTransport;
}

/**
 * Sends one message through whichever provider is configured.
 *
 * Returns `{ sent: false }` when no provider is configured — the caller
 * decides whether that is acceptable. It deliberately does NOT throw in
 * that case, so a missing email setup cannot break checkout. It DOES throw
 * when a configured provider rejects the message, because that is a real
 * failure the caller needs to surface rather than swallow.
 */
export async function sendMail(msg: MailMessage): Promise<{ sent: boolean; provider: MailProvider }> {
  const provider = resolveProvider();
  const from = resolveFrom();

  if (provider === "none") {
    console.warn(
      `No email provider configured — skipping "${msg.subject}" to ${msg.to}. ` +
        `Set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY.`,
    );
    return { sent: false, provider };
  }

  if (provider === "gmail") {
    await getSmtp().sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      headers: msg.headers,
    });
    return { sent: true, provider };
  }

  const { error } = await getResend().emails.send({
    from,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    headers: msg.headers,
  });

  if (error) {
    throw new Error(`Resend rejected "${msg.subject}": ${error.message}`);
  }

  return { sent: true, provider };
}
