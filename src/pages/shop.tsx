import { Layout } from "@/components/layout"
import { useListProducts, useListCollections } from "@/lib/api-client"
import { Link, useLocation } from "wouter"
import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"

const EASE = [0.16, 1, 0.3, 1] as const

export default function Shop() {
  const [location] = useLocation()
  const searchParams = new URLSearchParams(window.location.search)
  
  const [category, setCategory] = useState<string>(searchParams.get("category") || "")
  const [sort, setSort] = useState<string>("newest")
  const [q, setQ] = useState(searchParams.get("q") || "")

  const { data: products, isLoading } = useListProducts({ 
    category: category || undefined,
    sort,
    q: q || undefined
  })
  const { data: collections } = useListCollections()

  const categories = [
    { value: "tees", label: "T-Shirts" },
    { value: "hoodies", label: "Hoodies" },
    { value: "bottoms", label: "Bottoms" },
    { value: "accessories", label: "Accessories" },
  ]

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 md:py-24">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-16 md:mb-24"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">All Drops</p>
          <h1 className="font-serif text-6xl md:text-8xl tracking-tight mb-6">
            Shop
          </h1>
          <p className="text-muted-foreground max-w-xl text-base font-light">
            240 GSM. 100% cotton. Made in India. Lowkey, always.
          </p>
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-12">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Category</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => setCategory("")}
                    className={cn(
                      "text-sm uppercase tracking-widest hover:text-primary transition-colors text-left",
                      category === "" ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c.value}>
                    <button
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "text-sm uppercase tracking-widest hover:text-primary transition-colors text-left",
                        category === c.value ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Sort By</h3>
              <ul className="space-y-4">
                {[
                  { value: "newest", label: "Newest Arrivals" },
                  { value: "trending", label: "Trending" },
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                ].map((s) => (
                  <li key={s.value}>
                    <button 
                      onClick={() => setSort(s.value)}
                      className={cn(
                        "text-sm uppercase tracking-widest hover:text-primary transition-colors text-left",
                        sort === s.value ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {collections && collections.length > 0 && (
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Drops</h3>
                <ul className="space-y-4">
                  {collections.map((c) => (
                    <li key={c.id}>
                      <Link 
                        href={`/collections/${c.slug}`}
                        className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[3/4] bg-card" />
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="py-32 text-center border border-border border-dashed">
                <h3 className="text-xl uppercase tracking-widest mb-4">No pieces found.</h3>
                <p className="text-muted-foreground">Adjust your filters to see more results.</p>
                <button 
                  onClick={() => { setCategory(""); setSort("newest"); setQ(""); }}
                  className="mt-8 text-sm uppercase tracking-widest border-b border-primary pb-1"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-16">
                {products?.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE }}
                  >
                    <Link href={`/products/${product.slug}`} className="group block">
                      <div className="aspect-[3/4] bg-card mb-6 overflow-hidden relative">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                        {product.isNew && (
                          <span className="absolute top-4 left-4 bg-background px-3 py-1 text-[10px] uppercase tracking-widest font-mono">
                            New
                          </span>
                        )}
                        {!product.inStock && (
                          <span className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                            Out of Stock
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100" />
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-sm uppercase tracking-wide group-hover:text-muted-foreground transition-colors mb-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest">
                            {product.colors.length} Color{product.colors.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
