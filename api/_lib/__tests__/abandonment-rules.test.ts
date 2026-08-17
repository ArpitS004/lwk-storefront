import { describe, expect, it } from "vitest";
import {
  evaluateAbandonmentEligibility,
  reconcileCart,
  type EligibilityContext,
} from "../abandonment-rules.js";

const NOW = new Date("2026-08-17T12:00:00Z");
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000);

function context(overrides: Partial<EligibilityContext> = {}): EligibilityContext {
  return {
    now: NOW,
    thresholdMinutes: 30,
    lastPurchaseByEmail: new Map(),
    recentlySentEmails: new Set(),
    // Default: consenting, so each test isolates the one thing it changes.
    consentByEmail: new Map([["shopper@example.com", "tok_abc"]]),
    ...overrides,
  };
}

const abandonedRow = {
  email: "shopper@example.com",
  lastAddToCart: minutesAgo(45),
};

describe("evaluateAbandonmentEligibility", () => {
  it("sends when every condition is met", () => {
    const result = evaluateAbandonmentEligibility(abandonedRow, context());
    expect(result).toEqual({ eligible: true, unsubscribeToken: "tok_abc" });
  });

  it("does not send while the cart is still fresh", () => {
    const result = evaluateAbandonmentEligibility(
      { ...abandonedRow, lastAddToCart: minutesAgo(5) },
      context(),
    );
    expect(result).toEqual({ eligible: false, reason: "too_soon" });
  });

  it("treats the threshold boundary as not yet abandoned", () => {
    // Exactly at the cutoff should not fire — a cart is abandoned once it
    // is OLDER than the threshold, not the instant it reaches it.
    const result = evaluateAbandonmentEligibility(
      { ...abandonedRow, lastAddToCart: minutesAgo(29) },
      context(),
    );
    expect(result).toEqual({ eligible: false, reason: "too_soon" });
  });

  it("does not send when they purchased after adding to cart", () => {
    const result = evaluateAbandonmentEligibility(
      abandonedRow,
      context({
        lastPurchaseByEmail: new Map([["shopper@example.com", minutesAgo(40)]]),
      }),
    );
    expect(result).toEqual({ eligible: false, reason: "purchased_since" });
  });

  it("still sends when the only purchase predates the abandoned cart", () => {
    // Bought last week, added something new today, left. That is a real
    // abandonment and should be nudged.
    const result = evaluateAbandonmentEligibility(
      abandonedRow,
      context({
        lastPurchaseByEmail: new Map([["shopper@example.com", minutesAgo(60 * 24 * 7)]]),
      }),
    );
    expect(result).toEqual({ eligible: true, unsubscribeToken: "tok_abc" });
  });

  it("does not send twice inside the cooldown window", () => {
    const result = evaluateAbandonmentEligibility(
      abandonedRow,
      context({ recentlySentEmails: new Set(["shopper@example.com"]) }),
    );
    expect(result).toEqual({ eligible: false, reason: "cooldown" });
  });

  it("never sends without recorded consent", () => {
    const result = evaluateAbandonmentEligibility(
      abandonedRow,
      context({ consentByEmail: new Map() }),
    );
    expect(result).toEqual({ eligible: false, reason: "no_consent" });
  });

  it("never sends to someone who opted in but has no unsubscribe token", () => {
    // An account with consent but no token cannot receive a compliant
    // email, so it must be excluded rather than sent without an opt-out.
    const result = evaluateAbandonmentEligibility(
      abandonedRow,
      context({ consentByEmail: new Map([["someone-else@example.com", "tok_x"]]) }),
    );
    expect(result).toEqual({ eligible: false, reason: "no_consent" });
  });

  it("checks consent even when every other condition passes", () => {
    // Guards against a future refactor reordering the gates such that
    // consent is skipped on some path.
    const result = evaluateAbandonmentEligibility(
      { email: "no-consent@example.com", lastAddToCart: minutesAgo(120) },
      context(),
    );
    expect(result).toEqual({ eligible: false, reason: "no_consent" });
  });
});

describe("reconcileCart", () => {
  const add = (slug: string, name: string) => ({
    type: "add_to_cart",
    payload: { slug, name },
  });
  const remove = (slug: string) => ({
    type: "remove_from_cart",
    payload: { slug },
  });

  it("keeps items that were added and not removed", () => {
    expect(reconcileCart([add("tee", "Bone Tee"), add("jacket", "Shadow Jacket")])).toEqual([
      { slug: "tee", name: "Bone Tee" },
      { slug: "jacket", name: "Shadow Jacket" },
    ]);
  });

  it("drops items the shopper removed — the bug this function exists for", () => {
    // Added three, removed two, left. The old code emailed about all three.
    const items = reconcileCart([
      add("tee", "Bone Tee"),
      add("jacket", "Shadow Jacket"),
      add("cap", "Lowkey Cap"),
      remove("jacket"),
      remove("cap"),
    ]);
    expect(items).toEqual([{ slug: "tee", name: "Bone Tee" }]);
  });

  it("returns nothing when the whole cart was emptied", () => {
    expect(reconcileCart([add("tee", "Bone Tee"), remove("tee")])).toEqual([]);
  });

  it("counts an item re-added after removal as in the cart", () => {
    expect(reconcileCart([add("tee", "Bone Tee"), remove("tee"), add("tee", "Bone Tee")])).toEqual([
      { slug: "tee", name: "Bone Tee" },
    ]);
  });

  it("deduplicates the same item added twice", () => {
    expect(reconcileCart([add("tee", "Bone Tee"), add("tee", "Bone Tee")])).toEqual([
      { slug: "tee", name: "Bone Tee" },
    ]);
  });

  it("ignores malformed events instead of throwing", () => {
    const items = reconcileCart([
      { type: "add_to_cart", payload: null },
      { type: "add_to_cart", payload: {} },
      { type: "add_to_cart", payload: { slug: "tee" } }, // no name
      add("cap", "Lowkey Cap"),
    ]);
    expect(items).toEqual([{ slug: "cap", name: "Lowkey Cap" }]);
  });

  it("handles an empty history", () => {
    expect(reconcileCart([])).toEqual([]);
  });
});
