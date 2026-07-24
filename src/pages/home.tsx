import { Layout } from "@/components/layout"
import { Hero } from "@/components/hero"
import { Link } from "wouter"
import { motion } from "framer-motion"
import { useListProducts, useListCollections } from "@/lib/api-client"
import { ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/format"
import heroImg from "@assets/generated_images/hero.jpg"
import dropImg from "@assets/generated_images/drop.jpg"
import journal1Img from "@assets/generated_images/journal-1.jpg"

const EASE = [0.16, 1, 0.3, 1] as const

export default function Home() {
  const { data: featuredProducts } = useListProducts({ sort: "trending" })
  const { data: collections } = useListCollections({ isFeatured: true })

  const allCollections = collections || []

  return (
    <Layout>
      {/* Hero */}
      <Hero />

      {/* Feature strip */}
      <section className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-6 flex flex-wrap justify-center gap-8 text-[10px] uppercase tracking-[0.25em]">
          <span>240 GSM Heavyweight</span>
          <span className="opacity-40">·</span>
          <span>100% Cotton Bio Washed</span>
          <span className="opacity-40">·</span>
          <span>Made in India</span>
          <span className="opacity-40">·</span>
          <span>Oversized Fit</span>
          <span className="opacity-40">·</span>
          <span>Pan India Shipping</span>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-24 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex justify-between items-end mb-12"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Fresh Drop</p>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">New Arrivals</h2>
          </div>
          <Link href="/shop" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts?.slice(0, 4).map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
            >
              <Link href={`/products/${product.slug}`} className="group block">
                <div className="aspect-[3/4] bg-muted mb-4 overflow-hidden relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  {product.isNew && (
                    <span className="absolute top-3 left-3 bg-accent text-white px-2 py-0.5 text-[9px] uppercase tracking-widest font-medium">
                      New
                    </span>
                  )}
                  {!product.inStock && (
                    <span className="absolute top-3 right-3 bg-background/80 backdrop-blur px-2 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                      Sold Out
                    </span>
                  )}
                </div>
                <h3 className="text-xs uppercase tracking-wide font-medium group-hover:text-muted-foreground transition-colors mb-1">
                  {product.name}
                </h3>
                <span className="text-xs font-medium">{formatPrice(product.price)}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Collections — Drop 001 / 002 / 003 */}
      <section className="py-24 bg-muted border-y border-border">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Archive</p>
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Collections</h2>
            </div>
            <Link href="/shop" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              All Drops <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allCollections.length > 0
              ? allCollections.slice(0, 3).map((col, i) => (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                  >
                    <Link
                      href={`/collections/${col.slug}`}
                      className="group relative aspect-[3/4] overflow-hidden bg-background block"
                    >
                      <img
                        src={col.heroImage || dropImg}
                        alt={col.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Collection</p>
                        <h3 className="text-xl font-extrabold uppercase text-white leading-tight">{col.name}</h3>
                        <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/80 border-b border-white/40 pb-0.5 group-hover:border-white transition-colors">
                          Shop Now <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))
              : [
                  { slug: "lowkey-always", label: "Drop 001", name: "Lowkey. Always.", img: dropImg },
                  { slug: "off-the-radar", label: "Drop 002", name: "Off The Radar", img: heroImg },
                  { slug: "unseen", label: "Drop 003", name: "Unseen", img: journal1Img },
                ].map((c, i) => (
                  <motion.div
                    key={c.slug}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                  >
                    <Link
                      href={`/collections/${c.slug}`}
                      className="group relative aspect-[3/4] overflow-hidden bg-background block"
                    >
                      <img
                        src={c.img}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">{c.label}</p>
                        <h3 className="text-xl font-extrabold uppercase text-white leading-tight">{c.name}</h3>
                        <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/80 border-b border-white/40 pb-0.5 group-hover:border-white transition-colors">
                          Shop Now <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* Brand manifesto */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="py-32 container mx-auto px-6 text-center max-w-3xl mx-auto"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">Our Ethos</p>
        <h2 className="font-serif text-4xl md:text-6xl tracking-tight leading-[1.05] mb-8">
          We Don't Follow<br/>The Noise.<br/>We Build Different.
        </h2>
        <p className="text-muted-foreground text-base mb-6 max-w-xl mx-auto leading-relaxed font-light">
          LWK is for those who don't need to shout. Quality-first, timeless design, built for the ones who stay lowkey and always win.
        </p>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-12">
          Made for college students · Creators · Designers · Entrepreneurs · Ages 18–30
        </p>
        <Link
          href="/about"
          className="uppercase tracking-widest text-sm border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
        >
          Our Story →
        </Link>
      </motion.section>
    </Layout>
  )
}
