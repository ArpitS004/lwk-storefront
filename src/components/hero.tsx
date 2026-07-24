import * as React from "react"
import { Link } from "wouter"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { ArrowRight, ArrowUpRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative -mt-20 h-screen min-h-[680px] w-full overflow-hidden bg-black"
    >
      {/* Background image with parallax + slow zoom */}
      <motion.div
        style={{ y: prefersReducedMotion ? 0 : imageY }}
        className="absolute inset-0 h-[120%] w-full"
      >
        <motion.img
          src="/hero-campaign.jpg"
          alt="LWK — Lowkey. Always. Editorial campaign"
          className="h-full w-full object-cover"
          initial={{ scale: 1.12, opacity: 0 }}
          animate={{ scale: 1.04, opacity: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
        />
      </motion.div>

      {/* Cinematic gradient overlays — black with a blood-red glow, brand tone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 32%, rgba(0,0,0,0.25) 62%, rgba(0,0,0,0.05) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 15% 100%, hsla(355,55%,22%,0.55), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

      {/* Content */}
      <motion.div
        style={{ opacity: prefersReducedMotion ? 1 : contentOpacity }}
        className="relative z-10 flex h-full w-full items-center"
      >
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-20">
          <div className="mx-auto flex max-w-[1500px] flex-col items-start text-left md:mx-0">
            {/* Drop tag */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
              className="mb-6 flex items-center gap-4"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[hsl(355,70%,58%)]">
                Drop 001
              </span>
              <span className="h-px w-10 bg-white/30" />
            </motion.div>

            {/* Headline — editorial serif */}
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
              className="font-serif text-[19vw] font-normal uppercase leading-[0.85] tracking-tight text-[#EFEAE1] sm:text-[15vw] md:text-[10vw] lg:text-[8vw] xl:text-[128px]"
            >
              Lowkey
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
              className="mt-4 mb-6 text-xl font-semibold uppercase tracking-[0.08em] text-white sm:text-2xl"
            >
              Out of your league.
            </motion.p>

            {/* Body copy */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
              className="mb-10 max-w-xs text-sm font-light leading-relaxed tracking-wide text-white/60"
            >
              <p>Different life.</p>
              <p>Different game.</p>
              <p>Know your level.</p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.88, ease: EASE }}
              className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center"
            >
              <Link
                href="/shop"
                className="group inline-flex items-center justify-between gap-8 bg-[#EFEAE1] px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-all duration-500 ease-out hover:-translate-y-0.5 hover:bg-white"
              >
                <span>Shop Collection</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/lookbook"
                className="group inline-flex items-center justify-between gap-8 border border-white/35 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white/5"
              >
                <span>Explore Lookbook</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom-left caption */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        className="absolute bottom-8 left-6 z-10 hidden max-w-[220px] text-[10px] font-medium uppercase leading-relaxed tracking-[0.15em] text-white/45 sm:block md:left-16 lg:left-20"
      >
        Premium heavyweight t-shirts crafted for everyday confidence.
      </motion.p>

      {/* Rotating badge — bottom right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 1, ease: EASE }}
        className="absolute bottom-32 right-8 z-10 hidden h-[88px] w-[88px] items-center justify-center md:flex lg:right-16"
      >
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute h-full w-full"
          animate={prefersReducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <path id="heroBadgeCircle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
          </defs>
          <text fill="rgba(255,255,255,0.55)" fontSize="7.2" letterSpacing="2.2">
            <textPath href="#heroBadgeCircle" startOffset="0%">
              DESIGNED IN INDIA &#8226; BUILT DIFFERENT &#8226;
            </textPath>
          </text>
        </motion.svg>
        <span className="text-[11px] font-black uppercase tracking-tight text-white">
          LWK<span className="text-[hsl(355,70%,58%)]">*</span>
        </span>
      </motion.div>

      {/* Scroll indicator — bottom right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.3, ease: EASE }}
        className="absolute bottom-8 right-8 z-10 hidden flex-col items-center gap-3 md:flex lg:right-16"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
          Scroll
        </span>
        <motion.span
          animate={prefersReducedMotion ? {} : { scaleY: [1, 0.6, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px origin-top bg-white/40"
        />
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
          Down
        </span>
      </motion.div>
    </section>
  )
}
