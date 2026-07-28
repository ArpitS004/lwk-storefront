// One-off seed script: populates collections + products so the storefront
// has real data to render. Run with: pnpm db:seed (after pnpm db:push).
import { db, pool, collectionsTable, productsTable } from "./index.js"

async function main() {
  console.log("Seeding collections...")
  await db
    .insert(collectionsTable)
    .values([
      {
        slug: "lowkey-always",
        name: "Lowkey. Always.",
        description:
          "The debut drop. Bandana-inspired graphics, 240 GSM oversized tees, built for those who move different.",
        heroImage: "/catalog/collections/drop-001.jpg",
        isFeatured: true,
      },
      {
        slug: "off-the-radar",
        name: "Off The Radar",
        description: "Nocturne tones and heavyweight layers for the ones who stay unbothered.",
        heroImage: "/catalog/collections/drop-002.jpg",
        isFeatured: true,
      },
      {
        slug: "unseen",
        name: "Unseen",
        description: "The foundation pieces — everyday essentials in bone, black, and blood red.",
        heroImage: "/catalog/collections/drop-003.jpg",
        isFeatured: true,
      },
    ])
    .onConflictDoNothing({ target: collectionsTable.slug })

  console.log("Seeding products...")
  await db
    .insert(productsTable)
    .values([
      {
        slug: "lowkey-out-of-your-league",
        name: "Lowkey Out Of Your League",
        category: "tees",
        price: 1799,
        compareAtPrice: 2199,
        description:
          "Bold editorial typography with layered floral texture on the back. A statement piece for those who stand apart.",
        images: ["/catalog/products/tee-ooyl.jpg"],
        colors: ["Blood Red", "Vintage Purple", "Bone"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "LWK-24-037",
        isNew: true,
        fabric: "240 GSM, 100% cotton, pre-shrunk, bio washed",
        careInstructions: "Machine wash cold, wash inside out, do not bleach, tumble dry low, iron inside out",
        collectionSlug: "lowkey-always",
        trendingScore: 90,
      },
      {
        slug: "lowkey-better-than-your-ex",
        name: "Lowkey Better Than Your Ex",
        category: "tees",
        price: 1799,
        compareAtPrice: 2199,
        description:
          "Bold statement typography with intricate bandana-inspired artwork. Made for those who move on and level up.",
        images: ["/catalog/products/tee-btye.jpg"],
        colors: ["Blood Red", "Dusty Pink", "Bone"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "LWK-24-033",
        isNew: true,
        fabric: "240 GSM, 100% cotton, pre-shrunk, bio washed",
        careInstructions: "Machine wash cold, wash inside out, do not bleach, tumble dry low, iron inside out",
        collectionSlug: "lowkey-always",
        trendingScore: 95,
      },
      {
        slug: "addie-tee",
        name: "addie",
        category: "tees",
        price: 1899,
        description:
          "Vintage-inspired typography with detailed back print and embroidery. Lowkey. High standards.",
        images: ["/catalog/products/tee-addie.jpg"],
        colors: ["Navy Blue", "Vintage Black"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "ADDIE-25-001",
        isNew: true,
        fabric: "240 GSM, 100% cotton, pre-shrunk, bio washed",
        careInstructions: "Machine wash cold, wash inside out, do not bleach",
        collectionSlug: "off-the-radar",
        trendingScore: 80,
      },
      {
        slug: "washed-black-tee",
        name: "Washed Black Tee",
        category: "tees",
        price: 1599,
        description: "The everyday essential — oversized fit in heavyweight washed black cotton.",
        images: ["/catalog/products/tee-washed-black.jpg"],
        colors: ["Washed Black"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "LWK-24-010",
        fabric: "240 GSM, 100% cotton",
        collectionSlug: "unseen",
        trendingScore: 60,
      },
      {
        slug: "bone-tee",
        name: "Bone Tee",
        category: "tees",
        price: 1599,
        description: "Minimal branding, maximum weight. Bone colourway, drop-shoulder oversized fit.",
        images: ["/catalog/products/tee-bone.jpg"],
        colors: ["Bone"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "LWK-24-011",
        fabric: "240 GSM, 100% cotton",
        collectionSlug: "unseen",
        trendingScore: 55,
      },
      {
        slug: "hoodie-nocturne",
        name: "Nocturne Hoodie",
        category: "hoodies",
        price: 2999,
        compareAtPrice: 3499,
        description: "Heavyweight fleece hoodie in deep nocturne tones. Built for cold nights, made to last.",
        images: ["/catalog/products/hoodie-nocturne.jpg"],
        colors: ["Nocturne Black"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "LWK-24-050",
        isNew: true,
        fabric: "400 GSM heavyweight fleece, 80% cotton / 20% polyester",
        collectionSlug: "off-the-radar",
        trendingScore: 85,
      },
      {
        slug: "hoodie-black-lwk",
        name: "LWK Hoodie",
        category: "hoodies",
        price: 2799,
        description: "Signature LWK branding across a heavyweight, oversized silhouette.",
        images: ["/catalog/products/hoodie-black-lwk.jpg"],
        colors: ["Black"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        sku: "LWK-24-051",
        fabric: "400 GSM heavyweight fleece",
        collectionSlug: "unseen",
        trendingScore: 70,
      },
      {
        slug: "cargo-utility",
        name: "Utility Cargo Pant",
        category: "bottoms",
        price: 2499,
        description: "Multi-pocket utility cargo built for movement, in durable ripstop cotton.",
        images: ["/catalog/products/cargo-utility.jpg"],
        colors: ["Black", "Olive"],
        sizes: ["S", "M", "L", "XL"],
        sku: "LWK-24-060",
        fabric: "Ripstop cotton twill",
        collectionSlug: "off-the-radar",
        trendingScore: 65,
      },
      {
        slug: "jacket-shadow",
        name: "Shadow Jacket",
        category: "jackets",
        price: 3999,
        description: "Lightweight technical shell for transitional weather, cut for an oversized fit.",
        images: ["/catalog/products/jacket-shadow.jpg"],
        colors: ["Black"],
        sizes: ["S", "M", "L", "XL"],
        sku: "LWK-24-070",
        isLimited: true,
        fabric: "Technical nylon shell",
        collectionSlug: "off-the-radar",
        trendingScore: 75,
      },
      {
        slug: "cap-structured",
        name: "Structured Cap",
        category: "accessories",
        price: 999,
        description: "Six-panel structured cap with embroidered LWK branding.",
        images: ["/catalog/products/cap-structured.jpg"],
        colors: ["Black", "Bone"],
        sizes: ["One Size"],
        sku: "LWK-24-080",
        fabric: "100% cotton twill",
        collectionSlug: "unseen",
        trendingScore: 50,
      },
    ])
    .onConflictDoNothing({ target: productsTable.slug })

  console.log("Done.")
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
