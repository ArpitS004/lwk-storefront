import { Layout } from "@/components/layout"
import { useGetOrder } from "@/lib/api-client"
import { useRoute, Link } from "wouter"
import { Check } from "lucide-react"
import { formatPrice } from "@/lib/format"

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber")
  const orderNumber = params?.orderNumber || ""

  const { data: order, isLoading } = useGetOrder(orderNumber, {
    query: { enabled: !!orderNumber, queryKey: ["getOrder", orderNumber] }
  })

  return (
    <Layout>
      <div className="container mx-auto px-6 py-24 md:py-32 max-w-3xl">
        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-card w-1/2 mx-auto" />
            <div className="h-64 bg-card" />
          </div>
        ) : order ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border border-primary flex items-center justify-center mx-auto mb-8">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl uppercase tracking-tighter mb-4">Order Received</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-sm mb-12">
              Thank you. Stay lowkey. Your order is confirmed.
            </p>

            <div className="bg-card border border-border p-8 text-left mb-12">
              <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-border">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Order Number</h3>
                  <p className="font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Date</h3>
                  <p className="font-mono">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</h3>
                  <p className="font-mono text-sm break-all">{order.email}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total</h3>
                  <p className="font-medium">{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Items</h3>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <img src={item.image} alt={item.name} className="w-12 h-16 object-cover grayscale" />
                    <div className="flex-1">
                      <p className="text-sm uppercase tracking-widest">{item.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{item.color} / {item.size} × {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/shop" className="border-b border-primary pb-1 uppercase tracking-widest text-sm hover:text-muted-foreground transition-colors">
              Continue Exploring
            </Link>
          </div>
        ) : (
          <div className="text-center py-20">
            <h1 className="text-2xl uppercase tracking-widest mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-8">We could not locate this order in our records.</p>
            <Link href="/" className="border-b border-primary pb-1 uppercase tracking-widest text-sm">
              Return Home
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}
