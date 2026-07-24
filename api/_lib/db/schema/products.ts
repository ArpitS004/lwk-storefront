import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: doublePrecision("price").notNull(),
  compareAtPrice: doublePrecision("compare_at_price"),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  colors: text("colors").array().notNull(),
  sizes: text("sizes").array().notNull(),
  sku: text("sku").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  isNew: boolean("is_new").notNull().default(false),
  isLimited: boolean("is_limited").notNull().default(false),
  stockCount: integer("stock_count"),
  fabric: text("fabric"),
  careInstructions: text("care_instructions"),
  collectionSlug: text("collection_slug"),
  trendingScore: integer("trending_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
