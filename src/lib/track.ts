import type { EventType } from "@/lib/track-types";

const VISITOR_ID_KEY = "lwk_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/**
 * Fire-and-forget behavioral event tracker. Never throws and never blocks
 * the UI — a failed or slow tracking call should never affect shopping.
 */
export function trackEvent(type: EventType, payload: Record<string, unknown> = {}): void {
  try {
    const body = JSON.stringify({
      visitorId: getVisitorId(),
      type,
      payload,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
    });

    // navigator.sendBeacon survives page unloads (e.g. closing the tab
    // right after checkout) better than a normal fetch would.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently ignore — tracking failures should never surface to the user.
    });
  } catch {
    // Same reasoning: never let tracking break the shopping experience.
  }
}
