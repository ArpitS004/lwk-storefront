import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db, productsTable, reviewsTable } from "../db/index.js";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  GetProductParams,
  GetProductResponse,
  GetRelatedProductsParams,
  GetRelatedProductsResponse,
  ListProductReviewsParams,
  ListProductReviewsResponse,
} from "../api-zod/index.js";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, collectionSlug, size, color, minPrice, maxPrice, sort, q, isNew, isLimited } =
    parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (collectionSlug) conditions.push(eq(productsTable.collectionSlug, collectionSlug));
  if (size) conditions.push(sql`${size} = ANY(${productsTable.sizes})`);
  if (color) conditions.push(sql`${color} = ANY(${productsTable.colors})`);
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, maxPrice));
  if (isNew !== undefined) conditions.push(eq(productsTable.isNew, isNew));
  if (isLimited !== undefined) conditions.push(eq(productsTable.isLimited, isLimited));
  if (q) {
    conditions.push(
      or(ilike(productsTable.name, `%${q}%`), ilike(productsTable.description, `%${q}%`)),
    );
  }

  let orderBy;
  switch (sort) {
    case "price-asc":
      orderBy = asc(productsTable.price);
      break;
    case "price-desc":
      orderBy = desc(productsTable.price);
      break;
    case "trending":
      orderBy = desc(productsTable.trendingScore);
      break;
    default:
      orderBy = desc(productsTable.createdAt);
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy);

  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, params.data.slug));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

router.get("/products/:slug/related", async (req, res): Promise<void> => {
  const params = GetRelatedProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, params.data.slug));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const related = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.category, product.category),
        sql`${productsTable.slug} != ${product.slug}`,
      ),
    )
    .limit(4);

  res.json(GetRelatedProductsResponse.parse(related));
});

router.get("/products/:slug/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productSlug, params.data.slug))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(ListProductReviewsResponse.parse(reviews));
});

export default router;
