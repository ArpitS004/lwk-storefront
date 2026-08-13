import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, collectionsTable } from "../db/index.js";
import {
  ListCollectionsQueryParams,
  ListCollectionsResponse,
  GetCollectionParams,
  GetCollectionResponse,
} from "../api-zod/index.js";

const router = Router();

router.get("/collections", async (req, res): Promise<void> => {
  const parsed = ListCollectionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const collections = await db
    .select()
    .from(collectionsTable)
    .where(
      parsed.data.isFeatured !== undefined
        ? eq(collectionsTable.isFeatured, parsed.data.isFeatured)
        : undefined,
    )
    .orderBy(desc(collectionsTable.createdAt));

  res.json(ListCollectionsResponse.parse(collections));
});

router.get("/collections/:slug", async (req, res): Promise<void> => {
  const params = GetCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, params.data.slug));

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  res.json(GetCollectionResponse.parse(collection));
});

export default router;
