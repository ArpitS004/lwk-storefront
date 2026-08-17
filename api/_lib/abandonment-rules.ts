// Deterministic rules for the abandoned-cart automation.
//
// Kept as pure functions, separate from the route that queries the
// database, for two reasons: they are the part that decides whether a real
// person receives a real email, so they need to be unit-testable without a
// database; and this is the seed of the wider rule engine — nothing here
// may ever call an AI model or an external service.
//
// The AI writes copy. These functions decide who gets contacted.

export interface CartActivityRow {
  email: string;
  lastAddToCart: Date;
}

export interface EligibilityContext {
  now: Date;
  thresholdMinutes: number;
  /** email -> most recent purchase timestamp */
  lastPurchaseByEmail: Map<string, Date>;
  /** emails already nudged inside the cooldown window */
  recentlySentEmails: Set<string>;
  /** email -> unsubscribe token, present only for accounts that opted in */
  consentByEmail: Map<string, string>;
}

export type IneligibleReason =
  | "too_soon"
  | "purchased_since"
  | "cooldown"
  | "no_consent";

export type EligibilityResult =
  | { eligible: true; unsubscribeToken: string }
  | { eligible: false; reason: IneligibleReason };

/**
 * Decides whether one person should receive an abandoned-cart nudge.
 *
 * Every condition is a hard gate — there is no scoring and no judgement
 * call. Ordered cheapest-and-most-common first so the common "they're
 * still shopping" case exits immediately.
 */
export function evaluateAbandonmentEligibility(
  row: CartActivityRow,
  ctx: EligibilityContext,
): EligibilityResult {
  const thresholdCutoff = new Date(ctx.now.getTime() - ctx.thresholdMinutes * 60_000);

  // Still active — their cart was touched more recently than the threshold.
  if (row.lastAddToCart > thresholdCutoff) {
    return { eligible: false, reason: "too_soon" };
  }

  // They bought something at or after the last cart activity, so nothing
  // was abandoned.
  const lastPurchase = ctx.lastPurchaseByEmail.get(row.email);
  if (lastPurchase && lastPurchase >= row.lastAddToCart) {
    return { eligible: false, reason: "purchased_since" };
  }

  // Already nudged recently. One reminder per abandonment, not a drip.
  if (ctx.recentlySentEmails.has(row.email)) {
    return { eligible: false, reason: "cooldown" };
  }

  // The hard gate: no recorded opt-in means no marketing, full stop.
  const unsubscribeToken = ctx.consentByEmail.get(row.email);
  if (!unsubscribeToken) {
    return { eligible: false, reason: "no_consent" };
  }

  return { eligible: true, unsubscribeToken };
}

export interface CartEvent {
  type: string;
  payload: Record<string, unknown> | null;
}

export interface ResolvedCartItem {
  slug: string;
  name: string;
}

/**
 * Rebuilds what is actually still in someone's cart by replaying their
 * add and remove events in chronological order.
 *
 * Reading add_to_cart alone — as this previously did — emails people about
 * items they deliberately took out. Add three, remove two, leave: the old
 * behaviour advertised all three back to them.
 *
 * @param events add_to_cart / remove_from_cart events, OLDEST FIRST.
 */
export function reconcileCart(events: CartEvent[]): ResolvedCartItem[] {
  const inCart = new Map<string, string>(); // slug -> name

  for (const event of events) {
    const slug = event.payload?.slug as string | undefined;
    const name = event.payload?.name as string | undefined;
    if (!slug) continue;

    if (event.type === "add_to_cart") {
      // Re-adding after a removal puts it back, which is correct.
      if (name) inCart.set(slug, name);
    } else if (event.type === "remove_from_cart") {
      inCart.delete(slug);
    }
  }

  return [...inCart.entries()].map(([slug, name]) => ({ slug, name }));
}
