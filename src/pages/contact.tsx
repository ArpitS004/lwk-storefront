import { Layout } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSubmitContactMessage } from "@/lib/api-client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, ArrowUpRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

export default function Contact() {
  const submitMessage = useSubmitContactMessage()
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage.mutate(
      { data: formData },
      { onSuccess: () => setSuccess(true) }
    )
  }

  return (
    <Layout>
      <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 md:grid-cols-2">
        {/* Left — dark editorial panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-black px-6 py-16 text-white sm:px-10 md:px-14 md:py-24 lg:px-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: "url(/hero-campaign.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 15%",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 0% 100%, hsla(355,55%,22%,0.5), transparent 70%)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative z-10"
          >
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[hsl(355,70%,58%)]">
              Get In Touch
            </p>
            <h1 className="mb-8 font-serif text-5xl font-normal uppercase leading-[0.92] tracking-tight md:text-7xl">
              Let&apos;s
              <br />
              Talk.
            </h1>
            <p className="max-w-sm text-sm font-light leading-relaxed text-white/55">
              Questions about a drop, a wholesale inquiry, or just want to say
              lowkey hi — our studio reads every message.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="relative z-10 mt-16 space-y-10 md:mt-0"
          >
            <div className="border-t border-white/10 pt-6">
              <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
                Inquiries
              </h2>
              <a
                href="mailto:info@lwk-atelier.com"
                className="group inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white transition-colors hover:text-white/70"
              >
                info@lwk-atelier.com
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
                Press &amp; Wholesale
              </h2>
              <a
                href="mailto:studio@lwk-atelier.com"
                className="group inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white transition-colors hover:text-white/70"
              >
                studio@lwk-atelier.com
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
                Studio (Appointments Only)
              </h2>
              <p className="text-sm uppercase leading-relaxed tracking-widest text-white/70">
                182 Minimalist Ave
                <br />
                Los Angeles, CA 90021
                <br />
                United States
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right — form panel */}
        <div className="flex items-center px-6 py-16 sm:px-10 md:px-14 md:py-24 lg:px-20">
          <div className="w-full max-w-md">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="flex h-full flex-col items-center justify-center border border-dashed border-border p-12 text-center"
              >
                <h3 className="mb-4 font-serif text-2xl font-normal uppercase tracking-tight">
                  Message Received
                </h3>
                <p className="text-muted-foreground">
                  Our studio will be in touch shortly.
                </p>
                <Button
                  variant="outline"
                  className="mt-8"
                  onClick={() => {
                    setSuccess(false)
                    setFormData({ name: "", email: "", subject: "", message: "" })
                  }}
                >
                  Send Another
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div>
                  <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                    Send A Message
                  </span>
                  <h2 className="font-serif text-3xl font-normal uppercase tracking-tight text-foreground">
                    Say Hello
                  </h2>
                </div>

                <Input
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Subject"
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
                <textarea
                  placeholder="Message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full resize-none border-b border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <Button type="submit" disabled={submitMessage.isPending} className="w-full">
                  {submitMessage.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Transmit"
                  )}
                </Button>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
