// Single source of truth for environment configuration.
//
// Two goals: (1) fail fast and loudly at startup when something genuinely
// required is missing, rather than 500ing on an unrelated request later,
// and (2) make it obvious which optional integrations are switched off,
// so "why didn't the email send" has a visible answer in the logs instead
// of being a silent no-op.
//
// Deliberately NOT throwing for optional integrations (Resend, DeepSeek,
// Razorpay). Those degrade gracefully by design and the storefront must
// keep working without them.

export const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. The API cannot start without it. ` +
        `See .env.example for what it should contain.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

/**
 * Required in production, optional locally. Used for things that are a
 * security hole if missing on a public deployment but only a convenience
 * during local development.
 */
function requiredInProduction(name: string, reason: string): string | undefined {
  const value = process.env[name];
  if (!value && isProduction) {
    throw new Error(`${name} must be set in production — ${reason}`);
  }
  return value || undefined;
}

export const env = {
  isProduction,

  // --- Required everywhere ---
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),

  // --- Required in production only ---
  // Without this the scheduled abandoned-cart endpoint would be callable
  // by anyone, which is a mass-email trigger.
  CRON_SECRET: requiredInProduction(
    "CRON_SECRET",
    "without it the /cart-abandonment/check endpoint is publicly callable.",
  ),

  // --- Optional integrations (features switch off cleanly when unset) ---
  APP_BASE_URL: optional("APP_BASE_URL"),
  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),
  RESEND_API_KEY: optional("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: optional("RESEND_FROM_EMAIL"),

  // Free alternative to Resend, used when both are set. Google itself
  // sends the mail, so it authenticates properly and reaches any
  // recipient — no verified domain needed. 500 recipients/day.
  GMAIL_USER: optional("GMAIL_USER"),
  GMAIL_APP_PASSWORD: optional("GMAIL_APP_PASSWORD"),
  GMAIL_FROM_NAME: optional("GMAIL_FROM_NAME"),
  DEEPSEEK_API_KEY: optional("DEEPSEEK_API_KEY"),
  RAZORPAY_KEY_ID: optional("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: optional("RAZORPAY_KEY_SECRET"),

  // --- Tunables ---
  ABANDONMENT_THRESHOLD_MINUTES: Number(process.env.ABANDONMENT_THRESHOLD_MINUTES) || 30,
  API_PORT: Number(process.env.API_PORT) || 8787,
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",

  // Escape hatch for the unauthenticated demo order route. Off unless
  // explicitly enabled, so production can't create unpaid orders.
  ALLOW_UNPAID_ORDERS: process.env.ALLOW_UNPAID_ORDERS === "true",
} as const;

/**
 * Logs which optional integrations are active. Called once at startup.
 * This is the thing that would have made "emails silently never sent"
 * obvious immediately instead of after days of debugging.
 */
export function reportEnvStatus(log: (msg: string) => void): void {
  const emailProvider = env.GMAIL_USER && env.GMAIL_APP_PASSWORD
    ? `gmail(${env.GMAIL_USER})`
    : env.RESEND_API_KEY
      ? "resend"
      : "OFF — emails will be skipped";

  const status = [
    `email=${emailProvider}`,
    `ai(deepseek)=${env.DEEPSEEK_API_KEY ? "on" : "OFF — using fallback copy"}`,
    `google-signin=${env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.APP_BASE_URL ? "on" : "OFF"}`,
    `payments(razorpay)=${env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? "on" : "OFF"}`,
    `cron-auth=${env.CRON_SECRET ? "on" : "OFF"}`,
    `abandonment-threshold=${env.ABANDONMENT_THRESHOLD_MINUTES}min`,
  ].join("  ");

  log(`[env] ${status}`);
}
