import { Layout } from "@/components/layout"
import { motion } from "framer-motion"
import atelierImg from "@assets/generated_images/atelier.jpg"
import dropImg from "@assets/generated_images/drop.jpg"

const EASE = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

const values = [
  {
    n: "01",
    name: "Quality First",
    desc: "240 GSM heavyweight cotton. Pre-shrunk, bio-washed, double-needle stitched. Every spec is deliberate.",
  },
  {
    n: "02",
    name: "Timeless Design",
    desc: "No seasonal gimmicks. We design pieces that outlast the hype cycle — built for your wardrobe, not for the algorithm.",
  },
  {
    n: "03",
    name: "Simplicity",
    desc: "Restraint is the flex. Minimal branding, clean silhouettes, and graphics that say everything without saying too much.",
  },
  {
    n: "04",
    name: "Confidence",
    desc: "Wear what you stand for. LWK is for those who don't need validation from a logo but carry themselves like a brand.",
  },
  {
    n: "05",
    name: "Authenticity",
    desc: "Built in India. Made for India. We don't pretend to be something we're not — and that's exactly what makes us different.",
  },
]

export default function About() {
  return (
    <Layout>
      {/* Header */}
      <section className="container mx-auto max-w-4xl px-6 py-28 md:py-40">
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-accent"
        >
          Est. 2026 &middot; India
        </motion.p>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 1, delay: 0.12, ease: EASE }}
          className="mb-10 font-serif text-6xl font-normal uppercase leading-[0.92] tracking-tight text-foreground md:text-8xl"
        >
          Stay Lowkey.
          <br />
          Stay Original.
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.9, delay: 0.28, ease: EASE }}
          className="max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl"
        >
          LWK (Lowkey Always) was born out of a simple belief: the people who move
          the quietest make the loudest impact.
        </motion.p>
      </section>

      {/* Philosophy */}
      <section className="border-t border-border">
        <div className="container mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.1, ease: EASE }}
            className="aspect-[4/5] overflow-hidden bg-muted"
          >
            <img
              src={atelierImg}
              alt="LWK studio"
              className="h-full w-full object-cover opacity-90"
            />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-accent" />
              <h2 className="font-serif text-3xl font-normal uppercase tracking-tight text-foreground md:text-4xl">
                Who We Are
              </h2>
            </div>
            <div className="space-y-5 leading-relaxed text-muted-foreground">
              <p>
                We don&apos;t follow the noise. We build different. LWK was created
                for a generation that doesn&apos;t need to shout — the doers, the
                builders, the ones who show up quietly and consistently.
              </p>
              <p>
                Our target: college students, young professionals, designers,
                creators, and entrepreneurs aged 18–30 across India. People who
                care about what they wear but don&apos;t want to look like they&apos;re
                trying too hard.
              </p>
              <p>
                Phase One is just the beginning. But the ethos is permanent:{" "}
                <span className="font-medium uppercase tracking-wide text-foreground">
                  Lowkey. Always.
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Construction */}
      <section className="border-t border-border bg-muted">
        <div className="container mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE }}
            className="order-2 space-y-8 md:order-1"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-accent" />
              <h2 className="font-serif text-3xl font-normal uppercase tracking-tight text-foreground md:text-4xl">
                Built Different
              </h2>
            </div>
            <div className="space-y-5 leading-relaxed text-muted-foreground">
              <p>
                Every LWK piece is 240 GSM, 100% cotton — pre-shrunk, bio-washed, and
                cut oversized with drop shoulders. We use ribbed necks, woven
                labels, and double-needle stitching throughout.
              </p>
              <p>
                These aren&apos;t fast fashion reps. These are garments made to
                last, built with the kind of construction you feel when you put
                them on.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-border pt-6 text-sm">
              {[
                ["240 GSM", "Heavyweight Cotton"],
                ["Bio-Washed", "Soft-touch finish"],
                ["Drop Shoulder", "Oversized silhouette"],
                ["Woven Label", "Premium finishing"],
              ].map(([spec, detail]) => (
                <div key={spec}>
                  <p className="font-semibold uppercase tracking-wide text-foreground">
                    {spec}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.1, ease: EASE }}
            className="order-1 aspect-square overflow-hidden bg-background md:order-2"
          >
            <img
              src={dropImg}
              alt="LWK fabric detail"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border">
        <div className="container mx-auto max-w-6xl px-6 py-24 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-16 flex items-center justify-center gap-4 md:mb-20"
          >
            <span className="text-accent text-2xl leading-none">*</span>
            <h2 className="font-serif text-3xl font-normal uppercase tracking-tight text-foreground md:text-4xl">
              What We Stand For
            </h2>
            <span className="text-accent text-2xl leading-none">*</span>
          </motion.div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <motion.div
                key={v.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
                className="space-y-4 border-t-2 border-accent pt-6"
              >
                <span className="font-serif text-3xl text-accent/70">{v.n}</span>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                  {v.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="relative overflow-hidden border-t border-border bg-black py-28 text-white md:py-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url(/hero-campaign.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 55% at 50% 100%, hsla(355,55%,22%,0.5), transparent 70%)",
          }}
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          transition={{ duration: 0.9, ease: EASE }}
          className="container relative z-10 mx-auto max-w-3xl px-6 text-center"
        >
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
            The LWK Manifesto
          </p>
          <h2 className="mb-8 font-serif text-4xl font-normal uppercase leading-tight tracking-tight md:text-6xl">
            We don&apos;t follow the noise.
            <br />
            We build different.
          </h2>
          <p className="mb-12 text-base leading-relaxed text-white/65">
            Lowkey isn&apos;t a personality — it&apos;s a power move. It&apos;s showing
            up fully, doing the work, and letting the results speak. That&apos;s what
            LWK is built on. That&apos;s who LWK is built for.
          </p>

          <div className="mx-auto mb-12 flex max-w-md items-center gap-4">
            <span className="h-px flex-1 bg-white/15" />
            <span className="text-accent text-lg leading-none">*</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/85">
            No Comparison. No Competition. Just Lowkey.
          </p>
          <p className="mb-12 text-sm font-semibold uppercase tracking-[0.25em] text-white/85">
            Made For The Few. Not For Everyone.
          </p>

          <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
            19.0760&deg; N, 72.8777&deg; E &middot; Designed In India
          </p>
        </motion.div>
      </section>
    </Layout>
  )
}
