import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  // Nullable: accounts created via Google sign-in have no password at all.
  passwordHash: text("password_hash"),
  // Set for accounts created (or linked) via "Continue with Google". Unique
  // so the same Google account can't back two different rows.
  googleId: text("google_id").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),

  // Grants access to /admin and the analytics + automation APIs. Defaults
  // to false; promote an account with a deliberate SQL UPDATE rather than
  // exposing any self-service path to it.
  isAdmin: boolean("is_admin").notNull().default(false),

  // --- Marketing consent ---
  // Opt-IN only. Defaults to false, so an account can never receive
  // marketing mail unless the person actively ticked the box. Transactional
  // mail (order confirmations) is not governed by this flag.
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  // When the consent value last changed — the audit trail that matters if
  // anyone ever asks for proof of opt-in.
  consentUpdatedAt: timestamp("consent_updated_at", { withTimezone: true }),
  // Unguessable token embedded in the unsubscribe link of every marketing
  // email, so one click can revoke consent without requiring a login.
  unsubscribeToken: text("unsubscribe_token").unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
