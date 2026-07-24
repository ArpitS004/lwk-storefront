import { Layout } from "@/components/layout"
import { Link } from "wouter"
import { motion } from "framer-motion"
import journal1Img from "@assets/generated_images/journal-1.jpg"
import journal2Img from "@assets/generated_images/journal-2.jpg"
import atelierImg from "@assets/generated_images/atelier.jpg"
import heroImg from "@assets/generated_images/hero.jpg"

const EASE = [0.16, 1, 0.3, 1] as const

export default function Lookbook() {
  const posts = [
    {
      title: "Drop 001: Lowkey. Always.",
      category: "Lookbook",
      date: "DEC 2024",
      image: journal1Img,
      size: "lg" as const,
      excerpt: "The first release. Bandana-inspired graphics, 240 GSM weight, and a name that says what the clothes already know.",
    },
    {
      title: "240 GSM — Why It Matters",
      category: "Process",
      date: "NOV 2024",
      image: journal2Img,
      size: "sm" as const,
    },
    {
      title: "Built In India, For India",
      category: "Behind The Brand",
      date: "OCT 2024",
      image: atelierImg,
      size: "sm" as const,
    },
    {
      title: "Drop 000: Origin",
      category: "Lookbook",
      date: "AUG 2024",
      image: heroImg,
      size: "lg" as const,
      excerpt: "Where LWK started — the first samples, the first fits, the first no.",
    },
  ]

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 md:py-24">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-16 md:mb-24 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Visual Archive</p>
          <h1 className="font-serif text-6xl md:text-8xl tracking-tight mb-6">
            Lookbook
          </h1>
          <p className="text-muted-foreground text-base font-light">
            Drop stories, process notes, and visuals from inside the brand.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-20">
          {posts.map((post, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: (idx % 2) * 0.1, ease: EASE }}
              className={post.size === "lg" ? "md:col-span-2 group cursor-pointer" : "group cursor-pointer"}
            >
              <div className={post.size === "lg" ? "relative aspect-[16/8] bg-muted mb-6 overflow-hidden" : "relative aspect-[4/3] bg-muted mb-6 overflow-hidden"}>
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute top-5 left-5 text-[10px] font-medium uppercase tracking-[0.25em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Read the story →
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <div className={post.size === "lg" ? "max-w-xl" : ""}>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2 block">
                    {post.category}
                  </span>
                  <h2 className={post.size === "lg" ? "font-serif text-3xl md:text-4xl tracking-tight mb-2 group-hover:text-muted-foreground transition-colors" : "text-base font-extrabold uppercase tracking-wide group-hover:text-muted-foreground transition-colors"}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-md mt-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0 ml-4">{post.date}</span>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
          >
            Shop The Drops →
          </Link>
        </div>
      </div>
    </Layout>
  )
}
