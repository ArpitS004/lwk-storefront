import { Layout } from "@/components/layout"
import { useAuth } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { useEffect, useState } from "react"
import { Link } from "wouter"
import { Loader2 } from "lucide-react"

interface OrderLine {
  name: string
  size: string
  color: string
  quantity: number
  price: number
  image: string
}

interface AccountOrder {
  orderNumber: string
  items: OrderLine[]
  total: number
  status: string
  createdAt: string
}

export default function AccountOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<AccountOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    fetch("/api/account/orders", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load your orders")
        return res.json()
      })
      .then((data) => setOrders(data.orders ?? []))
      .catch((err) => setError(err.message))
  }, [authLoading, user])

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-32 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="mb-6 text-3xl uppercase tracking-widest">Orders</h1>
          <p className="mb-8 text-muted-foreground">You need to sign in to view your orders.</p>
          <Link
            href="/login"
            className="border-b border-primary pb-1 text-sm uppercase tracking-widest transition-colors hover:text-muted-foreground"
          >
            Sign in
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <h1 className="mb-12 text-4xl uppercase tracking-tighter">Orders</h1>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!orders && !error && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}

        {orders && orders.length === 0 && (
          <div className="border border-border bg-card p-12 text-center">
            <p className="mb-6 text-muted-foreground">You haven't placed any orders yet.</p>
            <Link
              href="/shop"
              className="border-b border-primary pb-1 text-sm uppercase tracking-widest transition-colors hover:text-muted-foreground"
            >
              Start shopping
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {orders?.map((order) => (
            <div key={order.orderNumber} className="border border-border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground ring-1 ring-border">
                    {order.status}
                  </span>
                  <p className="mt-1 font-mono text-sm">{formatPrice(order.total)}</p>
                </div>
              </div>

              <ul className="space-y-3">
                {order.items.map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="h-16 w-12 shrink-0 bg-muted">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover grayscale"
                        />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="uppercase tracking-widest">{item.name}</p>
                      <p className="mt-1 uppercase text-muted-foreground">
                        {item.color} / {item.size} &middot; Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-xs">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
