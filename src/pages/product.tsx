import { Layout } from "@/components/layout"
import { useGetProduct, useGetRelatedProducts } from "@/lib/api-client"
import { useRoute, Link } from "wouter"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCart } from "@/lib/cart"
import { useWishlist } from "@/lib/wishlist"
import { Button } from "@/components/ui/button"
import NotFound from "./not-found"
import { Heart, ChevronRight, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"

const EASE = [0.16, 1, 0.3, 1] as const

export default function Product() {
  const [, params] = useRoute("/products/:slug")
  const slug = params?.slug || ""

  const { data: product, isLoading } = useGetProduct(slug, {
    query: { enabled: !!slug, queryKey: ["getProduct", slug] }
  })

  const { data: related } = useGetRelatedProducts(slug, {
    query: { enabled: !!slug, queryKey: ["getRelatedProducts", slug] }
  })

  const { addItem } = useCart()
  const { addItem: addWishlist, removeItem: removeWishlist, hasItem: inWishlist } = useWishlist()

  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  // Auto-select first variant options when loaded
  if (product && !selectedColor && product.colors.length > 0) setSelectedColor(product.colors[0])
  if (product && !selectedSize && product.sizes.length > 0) setSelectedSize(product.sizes[0])

  if (!isLoading && !product) return <NotFound />

  const handleAddToCart = () => {
    if (!product || !selectedColor || !selectedSize) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
      image: product.images[0]
    })
  }

  const toggleWishlist = () => {
    if (inWishlist(slug)) removeWishlist(slug)
    else addWishlist(slug)
  }

  return (
    <Layout>
      {isLoading ? (
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[3/4] bg-card" />
          <div className="space-y-8 py-12"><div className="h-12 bg-card w-1/2" /><div className="h-6 bg-card w-1/4" /></div>
        </div>
      ) : product ? (
        <article className="container mx-auto px-6 py-12 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-32">
            
            {/* Gallery */}
            <div className="flex flex-col md:flex-row gap-6 lg:h-[80vh]">
              <div className="flex md:flex-col gap-4 overflow-auto md:w-24 shrink-0 order-2 md:order-1 no-scrollbar">
                {product.images.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-20 h-24 shrink-0 bg-card overflow-hidden opacity-60 hover:opacity-100 transition-opacity",
                      activeImage === i && "opacity-100 ring-1 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <img src={img} alt={`${product.name} view ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative flex-1 bg-card overflow-hidden order-1 md:order-2">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={product.images[activeImage]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
              className="flex flex-col py-0 lg:py-12"
            >
              <div className="mb-8">
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
                  <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
                  <ChevronRight className="h-3 w-3" />
                  <Link href={`/shop?category=${product.category}`} className="hover:text-primary transition-colors">
                    {product.category.replace('-', ' ')}
                  </Link>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">{product.name}</h1>
                <p className="text-2xl font-medium">{formatPrice(product.price)}</p>
              </div>

              <div className="space-y-8 mb-12">
                {product.colors.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs uppercase tracking-widest font-medium">Color: <span className="text-muted-foreground">{selectedColor}</span></span>
                    </div>
                    <div className="flex gap-3">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "w-12 h-12 rounded-full border border-border flex items-center justify-center text-xs uppercase transition-all",
                            selectedColor === color ? "border-primary bg-primary text-primary-foreground" : "hover:border-muted-foreground"
                          )}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs uppercase tracking-widest font-medium">Size</span>
                      <button className="text-xs uppercase tracking-widest text-muted-foreground underline underline-offset-4">Size Guide</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "h-12 border border-border flex items-center justify-center text-sm font-mono uppercase transition-all",
                            selectedSize === size ? "border-primary bg-primary text-primary-foreground" : "hover:border-muted-foreground"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex gap-4">
                  <div className="flex items-center border border-border h-14 shrink-0">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 h-full hover:bg-muted transition-colors"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-mono">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-4 h-full hover:bg-muted transition-colors"><Plus className="h-4 w-4" /></button>
                  </div>
                  
                  <Button 
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="flex-1 h-14 text-sm"
                  >
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-14 w-14 shrink-0"
                    onClick={toggleWishlist}
                  >
                    <Heart className={cn("h-5 w-5", inWishlist(slug) && "fill-primary text-primary")} strokeWidth={1.5} />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mt-4">
                  Free shipping on prepaid orders above ₹1999.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Details */}
          <div className="border-t border-border py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <h2 className="text-2xl uppercase tracking-widest mb-6">Product Details</h2>
            </div>
            <div className="md:col-span-7 space-y-12">
              <div className="prose prose-invert prose-p:text-muted-foreground prose-p:font-light max-w-none">
                <p>{product.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                {product.fabric && (
                  <div>
                    <h3 className="uppercase tracking-widest font-medium mb-3">Fabric</h3>
                    <p className="text-muted-foreground font-light">{product.fabric}</p>
                  </div>
                )}
                {product.careInstructions && (
                  <div>
                    <h3 className="uppercase tracking-widest font-medium mb-3">Care</h3>
                    <p className="text-muted-foreground font-light">{product.careInstructions}</p>
                  </div>
                )}
                <div>
                  <h3 className="uppercase tracking-widest font-medium mb-3">SKU</h3>
                  <p className="text-muted-foreground font-mono">{product.sku}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {related && related.length > 0 && (
            <div className="border-t border-border pt-24 mt-16">
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-12 text-center">Complete the look</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                  >
                    <Link href={`/products/${item.slug}`} className="group block">
                      <div className="aspect-[3/4] bg-card mb-4 overflow-hidden relative">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                      </div>
                      <h3 className="text-xs uppercase tracking-wide group-hover:text-muted-foreground transition-colors mb-1">
                        {item.name}
                      </h3>
                      <span className="text-xs font-medium">{formatPrice(item.price)}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </article>
      ) : null}
    </Layout>
  )
}
