import { Layout } from "@/components/layout"
import { useGetCollection, useListProducts } from "@/lib/api-client"
import { Link, useRoute } from "wouter"
import NotFound from "./not-found"
import journal1Img from "@assets/generated_images/journal-1.jpg"
import { formatPrice } from "@/lib/format"

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
        <div className="h-[60vh] bg-card animate-pulse" />
      ) : collection ? (
        <section className="relative h-[70vh] min-h-[500px] flex items-end pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-background">
            <img 
              src={collection.heroImage || journal1Img} 
              alt={collection.name} 
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity filter grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
          <div className="container relative mx-auto px-6 z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 block">
              Collection
            </span>
            <h1 className="text-5xl md:text-8xl font-medium tracking-tighter uppercase mb-6 max-w-4xl leading-[0.9]">
              {collection.name}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light">
              {collection.description}
            </p>
          </div>
        </section>
      ) : null}

      <section className="py-24 container mx-auto px-6">
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
