import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart"
import { Button } from "./ui/button"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCart()
  const [, setLocation] = useLocation()

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l border-border z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
          <h2 className="uppercase tracking-widest font-mono text-sm">Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground stroke-1" />
              <p className="text-muted-foreground text-sm uppercase tracking-widest">Your cart is empty.</p>
              <Button onClick={() => { setIsOpen(false); setLocation("/shop"); }} variant="outline">
                Explore Collection
              </Button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="h-32 w-24 bg-muted overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="uppercase tracking-wide text-sm font-medium">{item.name}</h3>
                        <p className="text-muted-foreground text-xs mt-1 uppercase">
                          {item.color} / {item.size}
                        </p>
                      </div>
                      <p className="font-medium text-sm">{formatPrice(item.price)}</p>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-xs uppercase text-muted-foreground hover:text-destructive tracking-widest transition-colors border-b border-transparent hover:border-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-6 bg-card space-y-4">
            <div className="flex justify-between font-medium text-sm uppercase tracking-wide">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              Shipping calculated at checkout. Free on prepaid orders above ₹1999.
            </p>
            <Button 
              className="w-full" 
              onClick={() => {
                setIsOpen(false)
                setLocation("/checkout")
              }}
            >
              Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
