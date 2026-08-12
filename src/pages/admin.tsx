import { Layout } from "@/components/layout"
import { useEffect, useState } from "react"

interface SegmentVisitor {
  visitorId: string
  segment: string
  insight: string
  counts: {
    pageViews: number
    productViews: number
    addToCarts: number
    checkoutsStarted: number
    purchases: number
  }
}

interface AnalyticsSummary {
  funnel: {
    pageViews: number
    productViews: number
    addToCarts: number
    checkoutsStarted: number
    purchasesCompleted: number
  }
  totalVisitors: number
  topProducts: { product: string; views: number }[]
}

const SEGMENT_LABELS: Record<string, string> = {
  window_shopper: "Window Shopper",
  interested_buyer: "Interested Buyer",
  high_intent_buyer: "High Intent Buyer",
  returning_customer: "Returning Customer",
  vip_customer: "VIP Customer",
}

const SEGMENT_COLORS: Record<string, string> = {
  window_shopper: "bg-muted text-muted-foreground",
  interested_buyer: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high_intent_buyer: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  returning_customer: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  vip_customer: "bg-accent/20 text-accent",
}

function FunnelStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-card p-6">
      <div className="text-3xl font-medium tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  )
}

export default function Admin() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [visitors, setVisitors] = useState<SegmentVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingDemo, setSendingDemo] = useState(false)
  const [demoResult, setDemoResult] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [summaryRes, segmentsRes] = await Promise.all([
      fetch("/api/analytics/summary").then((r) => r.json()),
      fetch("/api/segments").then((r) => r.json()),
    ])
    setSummary(summaryRes)
    setVisitors(segmentsRes.visitors ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const triggerAbandonedCartDemo = async () => {
    setSendingDemo(true)
    setDemoResult(null)
    try {
      const res = await fetch("/api/automations/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@example.com",
          items: [{ name: "Shadow Jacket", image: "/catalog/products/jacket-shadow.jpg" }],
        }),
      })
      if (res.ok) {
        setDemoResult("Cart abandonment email sent successfully.")
      } else {
        const body = await res.json().catch(() => ({}))
        setDemoResult(`Failed: ${body.error ?? res.statusText}`)
      }
    } catch (err) {
      setDemoResult("Failed to reach the automation endpoint.")
    } finally {
      setSendingDemo(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              AI Customer Intelligence
            </p>
            <h1 className="text-4xl tracking-tighter uppercase">Admin Dashboard</h1>
          </div>
          <button
            onClick={loadData}
            className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading analytics…</p>
        ) : (
          <>
            {/* Funnel */}
            <section className="mb-12">
              <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
                Behavior Funnel
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <FunnelStat label="Page Views" value={summary?.funnel.pageViews ?? 0} />
                <FunnelStat label="Product Views" value={summary?.funnel.productViews ?? 0} />
                <FunnelStat label="Add to Cart" value={summary?.funnel.addToCarts ?? 0} />
                <FunnelStat label="Checkout Started" value={summary?.funnel.checkoutsStarted ?? 0} />
                <FunnelStat label="Purchases" value={summary?.funnel.purchasesCompleted ?? 0} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {summary?.totalVisitors ?? 0} unique visitors tracked.
              </p>
            </section>

            {/* Top products */}
            {summary && summary.topProducts.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
                  Most Viewed Products
                </h2>
                <div className="border border-border bg-card">
                  {summary.topProducts.map((p, i) => (
                    <div
                      key={p.product}
                      className={`flex items-center justify-between px-6 py-3 text-sm ${
                        i !== 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <span>{p.product}</span>
                      <span className="font-mono text-muted-foreground">{p.views} views</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Automation demo trigger */}
            <section className="mb-12">
              <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
                AI Email Automation
              </h2>
              <div className="border border-border bg-card p-6">
                <p className="mb-4 text-sm text-muted-foreground">
                  In production, this fires automatically 30 minutes after a cart is
                  abandoned. Trigger it manually here to demo the email content live.
                </p>
                <button
                  onClick={triggerAbandonedCartDemo}
                  disabled={sendingDemo}
                  className="bg-primary px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                >
                  {sendingDemo ? "Sending…" : "Send Cart Abandonment Email Now"}
                </button>
                {demoResult && <p className="mt-3 text-sm">{demoResult}</p>}
              </div>
            </section>

            {/* Customer segments */}
            <section>
              <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
                Customer Segments ({visitors.length})
              </h2>
              <div className="space-y-3">
                {visitors.map((v) => (
                  <div key={v.visitorId} className="border border-border bg-card p-5">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {v.visitorId}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${
                          SEGMENT_COLORS[v.segment] ?? "bg-muted"
                        }`}
                      >
                        {SEGMENT_LABELS[v.segment] ?? v.segment}
                      </span>
                    </div>
                    <p className="mb-3 text-sm">{v.insight}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{v.counts.pageViews} page views</span>
                      <span>{v.counts.productViews} product views</span>
                      <span>{v.counts.addToCarts} added to cart</span>
                      <span>{v.counts.checkoutsStarted} checkouts started</span>
                      <span>{v.counts.purchases} purchases</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}
