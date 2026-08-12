import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { generateSegmentInsight } from "../deepseek.js";
import type { CustomerSegment } from "../db/schema/events.js";

const router: IRouter = Router();

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
        count(*) filter (where type = 'product_view') as product_views,
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
      where type = 'product_view' and payload->>'name' is not null
      order by visitor_id, count(*) over (partition by visitor_id, payload->>'name') desc
    )
    select c.*, t.top_product, t.top_product_views::text
    from counts c
    left join top_products t using (visitor_id)
    order by c.purchases desc, c.add_to_carts desc, c.product_views desc
    limit 50
  `);

  const results = [];
  for (const row of visitors.rows) {
    const counts = {
      pageViews: Number(row.page_views),
      productViews: Number(row.product_views),
      addToCarts: Number(row.add_to_carts),
      checkoutsStarted: Number(row.checkouts_started),
      purchases: Number(row.purchases),
    };
    const segment = classify(counts);
    const insight = await generateSegmentInsight({
      segment,
      eventCount:
        counts.pageViews + counts.productViews + counts.addToCarts + counts.checkoutsStarted + counts.purchases,
      purchaseCount: counts.purchases,
      topProduct: row.top_product ?? undefined,
      productViewCount: row.top_product_views ? Number(row.top_product_views) : undefined,
    });

    await db.execute(sql`
      insert into customer_segments (visitor_id, segment, insight, event_count, purchase_count, updated_at)
      values (
        ${row.visitor_id},
        ${segment},
        ${insight},
        ${counts.pageViews + counts.productViews + counts.addToCarts + counts.checkoutsStarted + counts.purchases},
        ${counts.purchases},
        now()
      )
      on conflict (visitor_id) do update set
        segment = excluded.segment,
        insight = excluded.insight,
        event_count = excluded.event_count,
        purchase_count = excluded.purchase_count,
        updated_at = now()
    `);

    results.push({
      visitorId: row.visitor_id,
      segment,
      insight,
      counts,
    });
  }

  res.json({ visitors: results });
});

// GET /analytics/summary — the funnel numbers for the admin dashboard.
router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const funnel = await db.execute<{ type: string; count: string }>(sql`
    select type, count(*) as count from events group by type
  `);

  const counts: Record<string, number> = {};
  for (const row of funnel.rows) {
    counts[row.type] = Number(row.count);
  }

  const topProducts = await db.execute<{ product: string; views: string }>(sql`
    select payload->>'name' as product, count(*) as views
    from events
    where type = 'product_view' and payload->>'name' is not null
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
