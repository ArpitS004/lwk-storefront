import { Layout } from "@/components/layout"
import atelierImg from "@assets/generated_images/atelier.jpg"
import dropImg from "@assets/generated_images/drop.jpg"

const values = [
  {
    name: "Quality First",
    desc: "240 GSM heavyweight cotton. Pre-shrunk, bio-washed, double-needle stitched. Every spec is deliberate.",
  },
  {
    name: "Timeless Design",
    desc: "No seasonal gimmicks. We design pieces that outlast the hype cycle — built for your wardrobe, not for the algorithm.",
  },
  {
    name: "Simplicity",
    desc: "Restraint is the flex. Minimal branding, clean silhouettes, and graphics that say everything without saying too much.",
  },
  {
    name: "Confidence",
    desc: "Wear what you stand for. LWK is for those who don't need validation from a logo but carry themselves like a brand.",
  },
  {
    name: "Authenticity",
    desc: "Built in India. Made for India. We don't pretend to be something we're not — and that's exactly what makes us different.",
  },
]

export default function About() {
  return (
    <Layout>
      {/* Header */}
      <section className="container mx-auto px-6 py-24 md:py-32 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">Est. 2024 · India</p>
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight uppercase mb-8 leading-[0.88]">
          Stay Lowkey.<br/>Stay Original.
        </h1>
        <p className="text-xl text-muted-foreground font-light max-w-2xl leading-relaxed">
          LWK (LOWKEY ALWAYS) was born out of a simple belief: the people who move the quietest make the loudest impact.
        </p>
      </section>

      {/* Philosophy */}
      <section className="border-t border-border">
        <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
          <div className="aspect-[4/5] bg-muted overflow-hidden">
            <img
              src={atelierImg}
              alt="LWK studio"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
          <div className="space-y-8">
            <h2 className="text-2xl font-extrabold tracking-tight uppercase">Who We Are</h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                We don't follow the noise. We build different. LWK was created for a generation that doesn't need to shout — the doers, the builders, the ones who show up quietly and consistently.
              </p>
              <p>
                Our target: college students, young professionals, designers, creators, and entrepreneurs aged 18–30 across India. People who care about what they wear but don't want to look like they're trying too hard.
              </p>
              <p>
                Phase One is just the beginning. But the ethos is permanent: <span className="text-foreground font-medium uppercase tracking-wide">Lowkey. Always.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Construction */}
      <section className="border-t border-border bg-muted">
        <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
          <div className="space-y-8 order-2 md:order-1">
            <h2 className="text-2xl font-extrabold tracking-tight uppercase">Built Different</h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                Every LWK piece is 240 GSM, 100% cotton — pre-shrunk, bio-washed, and cut oversized with drop shoulders. We use ribbed necks, woven labels, and double-needle stitching throughout.
              </p>
              <p>
                These aren't fast fashion reps. These are garments made to last, built with the kind of construction you feel when you put them on.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4 text-sm border-t border-border">
              {[
                ["240 GSM", "Heavyweight Cotton"],
                ["Bio-Washed", "Soft-touch finish"],
                ["Drop Shoulder", "Oversized silhouette"],
                ["Woven Label", "Premium finishing"],
              ].map(([spec, detail]) => (
                <div key={spec}>
                  <p className="font-extrabold uppercase tracking-wide text-foreground">{spec}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square bg-background overflow-hidden order-1 md:order-2">
            <img
              src={dropImg}
              alt="LWK fabric detail"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border">
        <div className="container mx-auto px-6 py-24 max-w-6xl">
          <h2 className="text-2xl font-extrabold tracking-tight uppercase mb-16 text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {values.map((v) => (
              <div key={v.name} className="border-t-2 border-accent pt-6 space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-widest">{v.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="border-t border-border bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/50 mb-8">The LWK Manifesto</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase leading-tight mb-8">
            We Don't Follow The Noise.<br/>We Build Different.
          </h2>
          <p className="text-primary-foreground/70 text-base leading-relaxed">
            Lowkey isn't a personality — it's a power move. It's showing up fully, doing the work, and letting the results speak. That's what LWK is built on. That's who LWK is built for.
          </p>
        </div>
      </section>
    </Layout>
  )
}
