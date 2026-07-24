import { Layout } from "@/components/layout"
import journal1Img from "@assets/generated_images/journal-1.jpg"
import journal2Img from "@assets/generated_images/journal-2.jpg"
import atelierImg from "@assets/generated_images/atelier.jpg"
import heroImg from "@assets/generated_images/hero.jpg"

export default function Lookbook() {
  const posts = [
    {
      title: "Drop 001: Lowkey. Always.",
      category: "Lookbook",
      date: "DEC 2024",
      image: journal1Img
    },
    {
      title: "240 GSM — Why It Matters",
      category: "Process",
      date: "NOV 2024",
      image: journal2Img
    },
    {
      title: "Built In India, For India",
      category: "Behind The Brand",
      date: "OCT 2024",
      image: atelierImg
    },
    {
      title: "Drop 000: Origin",
      category: "Lookbook",
      date: "AUG 2024",
      image: heroImg
    }
  ]

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 md:py-24">
        <header className="mb-16 md:mb-24">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Visual Archive</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase mb-6">
            Lookbook
          </h1>
          <p className="text-muted-foreground max-w-xl text-base">
            Drop stories, process notes, and visuals from inside the brand.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
          {posts.map((post, idx) => (
            <article key={idx} className="group cursor-pointer">
              <div className="aspect-[4/3] bg-muted mb-6 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2 block">
                    {post.category}
                  </span>
                  <h2 className="text-base font-extrabold uppercase tracking-wide group-hover:text-muted-foreground transition-colors">
                    {post.title}
                  </h2>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0 ml-4">{post.date}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  )
}
