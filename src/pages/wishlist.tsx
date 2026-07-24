import { Layout } from "@/components/layout"
import { useWishlist } from "@/lib/wishlist"
import { useGetProduct } from "@/lib/api-client"
import { Link } from "wouter"
import { Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/format"

// Component to fetch and display a single wishlist item to avoid passing hooks in loops incorrectly
function WishlistItemCard({ slug, onRemove }: { slug: string, onRemove: () => void }) {
  const { data: product, isLoading } = useGetProduct(slug, {
    query: { enabled: !!slug, queryKey: ["getProduct", slug] }
  })

  if (isLoading) return <div className="aspect-[3/4] bg-card animate-pulse" />
  if (!product) return null

  return (
    <div className="group block relative">
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-[3/4] bg-card mb-6 overflow-hidden relative">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter grayscale"
          />
        </div>
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm uppercase tracking-wide group-hover:text-muted-foreground transition-colors mb-1">
            {product.name}
          </h3>
          <span className="text-sm font-medium whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>
      <button 
        onClick={(e) => { e.preventDefault(); onRemove(); }}
        className="absolute top-4 right-4 bg-background/50 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
        title="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function Wishlist() {
  const { items, removeItem } = useWishlist()

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 md:py-24">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tighter uppercase mb-16">
          Wishlist
        </h1>

        {items.length === 0 ? (
          <div className="py-32 text-center border border-border border-dashed">
            <h3 className="text-xl uppercase tracking-widest mb-4">No saved pieces.</h3>
            <p className="text-muted-foreground mb-8">Your curated selection is empty.</p>
            <Link href="/shop" className="text-sm uppercase tracking-widest border-b border-primary pb-1 hover:text-muted-foreground transition-colors">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
            {items.map(slug => (
              <WishlistItemCard key={slug} slug={slug} onRemove={() => removeItem(slug)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
