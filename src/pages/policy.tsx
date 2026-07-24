import { Layout } from "@/components/layout"

const policies = {
  faq: {
    title: "FAQ",
    content: [
      { q: "How often do you drop new collections?", a: "We don't follow seasonal calendars. We release collections when they meet our standards. Newsletter subscribers are notified first." },
      { q: "Are pieces restocked?", a: "Core items may be restocked occasionally. Limited releases are never reproduced." },
      { q: "How do your garments fit?", a: "Our pieces are engineered for a slightly oversized, structural fit. We recommend taking your normal size unless you prefer a slimmer profile. Refer to the size guide on each product page." },
      { q: "Do you ship internationally?", a: "Yes. International shipping is calculated at checkout based on destination." }
    ]
  },
  "shipping-returns": {
    title: "Shipping & Returns",
    content: [
      { q: "Shipping Timeframes", a: "Domestic orders typically process within 2-3 business days. International orders process within 3-5 business days. You will receive tracking information once dispatched." },
      { q: "Return Policy", a: "Returns are accepted within 14 days of delivery for store credit only. Items must be unworn, unwashed, and retain all original tags and hardware." },
      { q: "Exchanges", a: "Due to limited quantities, we cannot guarantee stock for exchanges. We recommend processing a return for store credit and placing a new order." },
      { q: "Damaged Items", a: "If an item arrives damaged, please contact our studio within 48 hours of delivery with photographic evidence." }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    content: [
      { q: "Data Collection", a: "We collect minimal personal data necessary to process your transactions and improve your experience. We do not sell your data to third parties." },
      { q: "Communications", a: "If you join our newsletter, we will send you updates on new drops. You may unsubscribe at any time." },
      { q: "Cookies", a: "Our site uses essential cookies to maintain your cart and session state." }
    ]
  },
  terms: {
    title: "Terms of Service",
    content: [
      { q: "Acceptance", a: "By accessing this site, you agree to be bound by these terms." },
      { q: "Intellectual Property", a: "All content, designs, and branding on this site are the exclusive property of LWK Atelier." },
      { q: "Pricing", a: "Prices are subject to change without notice. We reserve the right to cancel orders resulting from pricing errors." }
    ]
  }
}

export default function PolicyPage({ type }: { type: keyof typeof policies }) {
  const policy = policies[type]

  return (
    <Layout>
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <h1 className="text-4xl md:text-6xl tracking-tighter uppercase mb-16">
          {policy.title}
        </h1>
        
        <div className="space-y-12">
          {policy.content.map((item, i) => (
            <div key={i} className="border-b border-border pb-8">
              <h3 className="text-lg tracking-widest uppercase mb-4">{item.q}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
