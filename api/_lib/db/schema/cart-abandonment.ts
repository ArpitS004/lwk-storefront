import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One row per abandoned-cart email actually sent, so the automated check
// (run on a schedule) never emails the same person twice for the same
// abandoned session.
export const cartAbandonmentEmailsTable = pgTable("cart_abandonment_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  // Snapshot of what was in the cart when the nudge went out, for auditing.
  items: jsonb("items").$type<{ name: string; image: string }[]>().notNull().default([]),
  // AI-generated (or fallback) message body actually sent.
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCartAbandonmentEmailSchema = createInsertSchema(cartAbandonmentEmailsTable).omit({
  id: true,
  sentAt: true,
});
export type InsertCartAbandonmentEmail = z.infer<typeof insertCartAbandonmentEmailSchema>;
export type CartAbandonmentEmail = typeof cartAbandonmentEmailsTable.$inferSelect;
