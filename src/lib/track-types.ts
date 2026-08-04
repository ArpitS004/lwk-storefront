// Mirrors EVENT_TYPES in api/_lib/db/schema/events.ts. Kept as a small,
// dependency-free constant on the frontend so src/lib/track.ts doesn't need
// to import anything from the api/ directory.
export const EVENT_TYPES = [
  "page_view",
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "wishlist_add",
  "wishlist_remove",
  "search",
  "checkout_started",
  "purchase_completed",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
