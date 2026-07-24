import { Layout } from "@/components/layout"
import { useCart } from "@/lib/cart"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateOrder } from "@/lib/api-client"
import { useState, useRef } from "react"
import { useLocation, Link } from "wouter"
import { Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/format"

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const [, setLocation] = useLocation()
  
  const createOrderMutation = useCreateOrder()
  const mutationRef = useRef(createOrderMutation.mutate)
  mutationRef.current = createOrderMutation.mutate

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    giftNote: ""
  })

  // Fixed values for demo (INR)
  const shipping = subtotal >= 1999 ? 0 : 99
  const tax = Math.round(subtotal * 0.18) // 18% GST
  const total = subtotal + shipping + tax

  if (items.length === 0 && !createOrderMutation.isSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="text-3xl uppercase tracking-widest mb-6">Checkout</h1>
          <p className="text-muted-foreground mb-8">Your cart is empty.</p>
          <Link href="/shop" className="border-b border-primary pb-1 uppercase tracking-widest text-sm hover:text-muted-foreground transition-colors">
            Return to shop
          </Link>
        </div>
      </Layout>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    mutationRef.current(
      {
        data: {
          email: formData.email,
          items: items.map(i => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            image: i.image
          })),
          shippingAddress: {
            fullName: formData.fullName,
            line1: formData.line1,
            line2: formData.line2 || null,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country
          },
          subtotal,
          shipping,
          tax,
          total,
          giftNote: formData.giftNote || null
        }
      },
      {
        onSuccess: (order) => {
          clearCart()
          setLocation(`/order-confirmation/${order.orderNumber}`)
        }
      }
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 lg:py-24">
        <h1 className="text-4xl tracking-tighter uppercase mb-12">Checkout</h1>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 lg:gap-24">
          <div className="xl:col-span-7 order-2 xl:order-1">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Contact Info */}
              <section>
                <h2 className="text-lg uppercase tracking-widest mb-6 pb-2 border-b border-border">Contact Information</h2>
                <div className="space-y-4">
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
              </section>

              {/* Shipping Info */}
              <section>
                <h2 className="text-lg uppercase tracking-widest mb-6 pb-2 border-b border-border">Shipping Address</h2>
                <div className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                  <Input 
                    placeholder="Address Line 1" 
                    required
                    value={formData.line1}
                    onChange={(e) => setFormData({...formData, line1: e.target.value})}
                  />
                  <Input 
                    placeholder="Address Line 2 (Optional)"
                    value={formData.line2}
                    onChange={(e) => setFormData({...formData, line2: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="City" 
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                    <Input 
                      placeholder="State / Province" 
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="ZIP / Postal Code" 
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      className="font-mono"
                    />
                    <Input 
                      placeholder="Country" 
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* Payment Placeholder */}
              <section>
                <h2 className="text-lg uppercase tracking-widest mb-6 pb-2 border-b border-border text-muted-foreground">Payment</h2>
                <div className="bg-card border border-border p-6 text-center space-y-2">
                  <p className="uppercase tracking-widest text-sm">Demo Environment</p>
                  <p className="text-xs text-muted-foreground font-mono">No actual payment processor is wired up. Clicking place order will generate a real order record via the API.</p>
                </div>
              </section>

              <Button 
                type="submit" 
                className="w-full h-16 text-lg"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Place Order"}
              </Button>
            </form>
          </div>

          <div className="xl:col-span-5 order-1 xl:order-2">
            <div className="bg-card border border-border p-8 sticky top-32">
              <h2 className="text-lg uppercase tracking-widest mb-8">Order Summary</h2>
              
              <ul className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto no-scrollbar">
                {items.map(item => (
                  <li key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-muted shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="uppercase text-xs tracking-widest">{item.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase mt-1">{item.color} / {item.size}</p>
                      <div className="flex justify-between items-center mt-2 text-xs font-mono">
                        <span>QTY: {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 border-t border-border pt-6 font-mono text-sm uppercase">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4 text-base font-medium">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
