import { Layout } from "@/components/layout"
import { useGetCollection, useListProducts } from "@/lib/api-client"
import { Link, useRoute } from "wouter"
import NotFound from "./not-found"
import { formatPrice } from "@/lib/format"
import { motion } from "framer-motion"
import { Globe2, Sparkle, Shirt } from "lucide-react"

const defaultHeroImage = "/lwk-collection-banner.jpg"
const EASE = [0.16, 1, 0.3, 1] as const

const specs = [
  { Icon: Globe2, title: "Premium Quality", detail: "240 GSM Heavyweight Cotton" },
  { Icon: Sparkle, title: "Designed To Last", detail: "Timeless details. Built to endure." },
  { Icon: Shirt, title: "Streetwear Essential", detail: "Oversized fits. Modern silhouettes." },
]

export default function Collection() {
  const [, params] = useRoute("/collections/:slug")
  const slug = params?.slug || ""

  const { data: collection, isLoading: collectionLoading } = useGetCollection(slug, {
    query: { enabled: !!slug, queryKey: ["getCollection", slug] }
  })

  const { data: products, isLoading: productsLoading } = useListProducts({ collectionSlug: slug }, {
    query: { enabled: !!slug, queryKey: ["listProducts", "collection", slug] }
  })

  if (!collectionLoading && !collection) return <NotFound />

  return (
    <Layout>
      {collectionLoading ? (
        <div className="h-screen bg-card animate-pulse" />
      ) : collection ? (
        <section className="relative -mt-20 flex h-screen min-h-[720px] flex-col justify-center overflow-hidden bg-black pt-20">
          <div className="absolute inset-0">
            <img 
              src={collection.heroImage || defaultHeroImage} 
              alt={collection.name} 
              className="w-full h-full object-cover object-[center_25%]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,0.2) 72%, rgba(0,0,0,0.08) 100%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" />
          </div>

          {/* Top-right brand tagline */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="absolute right-6 top-24 z-10 hidden text-right sm:block md:right-16"
          >
            <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.25em] text-white/60">
              No Comparison.
              <br />
              No Competition.
              <br />
              Just Lowkey.
            </p>
            <span className="mt-3 inline-block text-accent text-lg leading-none">*</span>
          </motion.div>

          {/* Bottom-right Estd. badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            className="absolute bottom-10 right-6 z-10 hidden flex-col items-center gap-2 border border-white/25 px-5 py-4 text-center sm:flex md:right-16"
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50">Estd</span>
            <span className="text-accent text-xl leading-none">*</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">2026</span>
          </motion.div>

          {/* Main content */}
          <div className="container relative z-10 mx-auto px-6 md:px-10 lg:px-16">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="mb-6 block text-xs font-semibold uppercase tracking-[0.35em] text-accent"
            >
              Collection
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.12, ease: EASE }}
              className="mb-3 max-w-4xl font-sans text-[15vw] font-black uppercase leading-[0.85] tracking-tight text-[#EFEAE1] sm:text-[11vw] md:text-[8vw] lg:text-[6vw] xl:text-[104px]"
            >
              {collection.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: EASE }}
              className="mb-7 text-sm font-semibold uppercase tracking-[0.3em] text-white/70"
            >
              Lowkey. Always.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
              className="mb-9 max-w-xl text-base font-light leading-relaxed text-white/60 md:text-lg"
            >
              {collection.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.52, ease: EASE }}
            >
              <a
                href="#shop-grid"
                className="group mb-12 inline-flex items-center gap-3 bg-[hsl(355,55%,32%)] px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-500 ease-out hover:-translate-y-0.5 hover:bg-[hsl(355,55%,26%)]"
              >
                Explore Collection
                <span className="transition-transform duration-500 group-hover:translate-y-0.5">&darr;</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.64, ease: EASE }}
              className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-7 sm:grid-cols-3"
            >
              {specs.map(({ Icon, title, detail }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/85">{title}</p>
                    <p className="mt-1 text-[11px] uppercase leading-relaxed tracking-wide text-white/45">
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom-left coordinates */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
            className="absolute bottom-8 left-6 z-10 hidden text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 md:left-16 lg:block"
          >
            19.0760&deg; N, 72.8777&deg; E &middot; Designed In India
          </motion.p>
        </section>
      ) : null}

      <section id="shop-grid" className="py-24 container mx-auto px-6 scroll-mt-20">
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-card" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="py-32 text-center border border-border border-dashed">
            <h3 className="text-xl uppercase tracking-widest mb-4">Collection pending.</h3>
            <p className="text-muted-foreground">Products for this drop are not yet available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
            {products?.map((product) => (
              <Link 
                key={product.id} 
                href={`/products/${product.slug}`}
                className="group block"
              >
                <div className="aspect-[3/4] bg-card mb-6 overflow-hidden relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter grayscale"
                  />
                  {product.isNew && (
                    <span className="absolute top-4 left-4 bg-background px-3 py-1 text-[10px] uppercase tracking-widest font-mono">
                      New
                    </span>
                  )}
                  {product.isLimited && (
                    <span className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-[10px] uppercase tracking-widest font-mono">
                      Limited
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm uppercase tracking-wide group-hover:text-muted-foreground transition-colors mb-1">
                      {product.name}
                    </h3>
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
