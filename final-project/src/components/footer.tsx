import { Link } from "wouter"
import { useSubscribeNewsletter } from "@/lib/api-client"
import { useState } from "react"
import { Input } from "./ui/input"
import { ArrowRight } from "lucide-react"

export function Footer() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const subscribe = useSubscribeNewsletter()

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    subscribe.mutate({ data: { email } }, {
      onSuccess: () => {
        setSubscribed(true)
        setEmail("")
      }
    })
  }

  return (
    <footer className="bg-background border-t border-border">
      {/* Feature strip */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "⚖️", label: "240 GSM Heavyweight" },
            { icon: "🌿", label: "100% Cotton Bio Washed" },
            { icon: "🇮🇳", label: "Made In India Premium Quality" },
            { icon: "🚀", label: "Pan India Shipping — Fast & Reliable" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 pt-16 pb-10 grid grid-cols-1 md:grid-cols-12 gap-12 mb-8">
        {/* Brand + newsletter */}
        <div className="md:col-span-4 space-y-6">
          <img src="/lwk-logo.png" alt="LWK" className="h-8 w-auto object-contain" />
          <p className="text-muted-foreground text-xs leading-relaxed uppercase tracking-widest max-w-xs">
            Lowkey. Always.<br/>
            Stay Lowkey. Stay Original.
          </p>
          <div className="pt-4">
            <p className="text-xs uppercase tracking-widest font-medium mb-4">Stay In The Loop</p>
            {subscribed ? (
              <p className="text-xs font-mono text-muted-foreground border-b border-border py-2 uppercase tracking-widest">You're in. Stay lowkey.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="relative max-w-xs">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-12 text-xs uppercase tracking-widest border-0 border-b border-border bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-primary"
                />
                <button
                  type="submit"
                  disabled={subscribe.isPending}
                  className="absolute right-0 top-0 bottom-0 px-3 hover:text-accent transition-colors text-muted-foreground"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Shop */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-[10px] font-medium text-foreground uppercase tracking-widest mb-5">Shop</h3>
          <ul className="space-y-3">
            <li><Link href="/shop" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">All Products</Link></li>
            <li><Link href="/shop?category=tees" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">T-Shirts</Link></li>
            <li><Link href="/shop?category=hoodies" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Hoodies</Link></li>
            <li><Link href="/shop?category=bottoms" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Bottoms</Link></li>
            <li><Link href="/shop?category=accessories" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Accessories</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-[10px] font-medium text-foreground uppercase tracking-widest mb-5">Company</h3>
          <ul className="space-y-3">
            <li><Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">About Us</Link></li>
            <li><Link href="/lookbook" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Lookbook</Link></li>
            <li><Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Our Standards</Link></li>
            <li><Link href="/shop" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Size Guide</Link></li>
            <li><Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Contact</Link></li>
          </ul>
        </div>

        {/* Help */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-[10px] font-medium text-foreground uppercase tracking-widest mb-5">Help</h3>
          <ul className="space-y-3">
            <li><Link href="/shipping" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Shipping & Delivery</Link></li>
            <li><Link href="/returns" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Returns & Exchanges</Link></li>
            <li><Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">FAQs</Link></li>
            <li><Link href="/track" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Track Order</Link></li>
            <li><Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 border-t border-border pt-8 pb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          © 2024 LWK. All rights reserved.
        </p>
        <div className="flex items-center gap-8">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Instagram</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  )
}
