import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { buildFallbackInsight, generateSegmentInsight } from "../deepseek.js";
import { requireAdmin } from "../middleware/require-admin.js";
import type { CustomerSegment } from "../db/schema/events.js";

const router = Router();

// Both routes below expose the full behavioural record of every visitor.
// Until now they were readable by anyone who guessed the URL.
router.use(["/segments", "/analytics/summary"], requireAdmin);

/**
 * Rule-based segmentation. Deliberately simple and deterministic — no ML
 * model, no external call in the hot path — so it's fast, free, and never
 * fails during a demo. The "AI" layer sits on top of this (see
 * generateSegmentInsight), generating a human-readable explanation of why
 * a visitor landed in a given segment, not the classification itself.
 */
function classify(counts: {
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkoutsStarted: number;
  purchases: number;
}): CustomerSegment {
  if (counts.purchases >= 2) return "vip_customer";
  if (counts.purchases >= 1) return "returning_customer";
  if (counts.checkoutsStarted >= 1 || counts.addToCarts >= 2) return "high_intent_buyer";
  if (counts.productViews >= 3) return "interested_buyer";
  return "window_shopper";
}

// GET /segments — computes (and upserts) a segment for every visitor with
// tracked events, then returns the full list for the admin dashboard.
router.get("/segments", async (_req, res): Promise<void> => {
  const visitors = await db.execute<{
    visitor_id: string;
    page_views: string;
    product_views: string;
    add_to_carts: string;
    checkouts_started: string;
    purchases: string;
    top_product: string | null;
    top_product_views: string | null;
  }>(sql`
    with counts as (
      select
        visitor_id,
        count(*) filter (where type = 'page_view') as page_views,
        -- payload->>'left' excludes the historical "view ended" rows. The
        -- product page used to fire product_view twice per visit (once on
        -- mount, once on unmount), which double-counted every view. New
        -- events use the distinct product_view_ended type instead; this
        -- filter keeps already-stored rows from skewing the numbers.
        count(*) filter (where type = 'product_view' and payload->>'left' is null) as product_views,
        count(*) filter (where type = 'add_to_cart') as add_to_carts,
        count(*) filter (where type = 'checkout_started') as checkouts_started,
        count(*) filter (where type = 'purchase_completed') as purchases
      from events
      group by visitor_id
    ),
    top_products as (
      select distinct on (visitor_id)
        visitor_id,
        payload->>'name' as top_product,
        count(*) over (partition by visitor_id, payload->>'name') as top_product_views
      from events
      where type = 'product_view'
        and payload->>'name' is not null
        and payload->>'left' is null
      order by visitor_id, count(*) over (partition by visitor_id, payload->>'name') desc
    )
    select c.*, t.top_product, t.top_product_views::text
    from counts c
    left join top_products t using (visitor_id)
    order by c.purchases desc, c.add_to_carts desc, c.product_views desc
    limit 50
  `);

  const rows = visitors.rows.map((row) => {
    const counts = {
      pageViews: Number(row.page_views),
      productViews: Number(row.product_views),
      addToCarts: Number(row.add_to_carts),
      checkoutsStarted: Number(row.checkouts_started),
      purchases: Number(row.purchases),
    };
    return {
      visitorId: row.visitor_id,
      counts,
      eventCount:
        counts.pageViews + counts.productViews + counts.addToCarts + counts.checkoutsStarted + counts.purchases,
      segment: classify(counts),
      topProduct: row.top_product ?? undefined,
      productViewCount: row.top_product_views ? Number(row.top_product_views) : undefined,
    };
  });

  // Reuse insight text we've already generated. This used to make one
  // DeepSeek call per visitor, sequentially, on every single page load —
  // measured at 34 seconds for 34 visitors, against a function timeout,
  // and it re-billed the same text every refresh.
  const cached = new Map<string, string>();
  if (rows.length > 0) {
    const existing = await db.execute<{ visitor_id: string; insight: string | null }>(sql`
      select visitor_id, insight from customer_segments
      where visitor_id = any(${sql.param(rows.map((r) => r.visitorId))}::text[])
    `);
    for (const row of existing.rows) {
      if (row.insight) cached.set(row.visitor_id, row.insight);
    }
  }

  // Generate only what's missing, in parallel, and cap it so one page load
  // can never fan out into an unbounded number of AI calls. Anything over
  // the cap gets the deterministic fallback now and a real insight on a
  // later load.
  const MAX_NEW_INSIGHTS_PER_REQUEST = 8;
  const needsInsight = rows.filter((r) => !cached.has(r.visitorId));
  const toGenerate = needsInsight.slice(0, MAX_NEW_INSIGHTS_PER_REQUEST);

  if (needsInsight.length > toGenerate.length) {
    console.info(
      `segments: generating ${toGenerate.length} of ${needsInsight.length} missing insights this request; the rest follow on later loads.`,
    );
  }

  const generated = await Promise.all(
    toGenerate.map(async (r) => ({
      visitorId: r.visitorId,
      insight: await generateSegmentInsight({
        segment: r.segment,
        eventCount: r.eventCount,
        purchaseCount: r.counts.purchases,
        topProduct: r.topProduct,
        productViewCount: r.productViewCount,
      }),
    })),
  );
  for (const g of generated) cached.set(g.visitorId, g.insight);

  const results = rows.map((r) => ({
    visitorId: r.visitorId,
    segment: r.segment,
    insight:
      cached.get(r.visitorId) ??
      buildFallbackInsight({
        segment: r.segment,
        eventCount: r.eventCount,
        purchaseCount: r.counts.purchases,
        topProduct: r.topProduct,
      }),
    counts: r.counts,
  }));

  // One statement instead of one per visitor. `insight` uses COALESCE so a
  // row we didn't regenerate this time keeps the text it already had.
  if (results.length > 0) {
    await db.execute(sql`
      insert into customer_segments (visitor_id, segment, insight, event_count, purchase_count, updated_at)
      select t.visitor_id, t.segment, t.insight, t.event_count, t.purchase_count, now()
      from unnest(
        ${sql.param(results.map((r) => r.visitorId))}::text[],
        ${sql.param(results.map((r) => r.segment))}::text[],
        ${sql.param(results.map((r) => (cached.has(r.visitorId) ? r.insight : null)))}::text[],
        ${sql.param(results.map((r) => r.counts.pageViews + r.counts.productViews + r.counts.addToCarts + r.counts.checkoutsStarted + r.counts.purchases))}::int[],
        ${sql.param(results.map((r) => r.counts.purchases))}::int[]
      ) as t(visitor_id, segment, insight, event_count, purchase_count)
      on conflict (visitor_id) do update set
        segment = excluded.segment,
        insight = coalesce(excluded.insight, customer_segments.insight),
        event_count = excluded.event_count,
        purchase_count = excluded.purchase_count,
        updated_at = now()
    `);
  }

  res.json({ visitors: results });
});

// GET /analytics/summary — the funnel numbers for the admin dashboard.
router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const funnel = await db.execute<{ type: string; count: string }>(sql`
    select type, count(*) as count
    from events
    -- See the note in GET /segments: historical product_view rows tagged
    -- with payload.left are "view ended" duplicates, not real views.
    where not (type = 'product_view' and payload->>'left' is not null)
    group by type
  `);

  const counts: Record<string, number> = {};
  for (const row of funnel.rows) {
    counts[row.type] = Number(row.count);
  }

  const topProducts = await db.execute<{ product: string; views: string }>(sql`
    select payload->>'name' as product, count(*) as views
    from events
    where type = 'product_view'
      and payload->>'name' is not null
      and payload->>'left' is null
    group by payload->>'name'
    order by views desc
    limit 5
  `);

  const totalVisitors = await db.execute<{ count: string }>(sql`
    select count(distinct visitor_id) as count from events
  `);

  res.json({
    funnel: {
      pageViews: counts["page_view"] ?? 0,
      productViews: counts["product_view"] ?? 0,
      addToCarts: counts["add_to_cart"] ?? 0,
      checkoutsStarted: counts["checkout_started"] ?? 0,
      purchasesCompleted: counts["purchase_completed"] ?? 0,
    },
    totalVisitors: Number(totalVisitors.rows[0]?.count ?? 0),
    topProducts: topProducts.rows.map((r) => ({ product: r.product, views: Number(r.views) })),
  });
});

export default router;
