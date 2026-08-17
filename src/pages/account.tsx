import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { Link, useLocation } from "wouter"
import { Loader2 } from "lucide-react"

export default function Account() {
  const { user, loading, setMarketingConsent } = useAuth()
  const [, setLocation] = useLocation()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-32 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="mb-6 text-3xl uppercase tracking-widest">Account</h1>
          <p className="mb-8 text-muted-foreground">You need to sign in to view your account.</p>
          <Link
            href="/login"
            className="border-b border-primary pb-1 text-sm uppercase tracking-widest transition-colors hover:text-muted-foreground"
          >
            Sign in
          </Link>
        </div>
      </Layout>
    )
  }

  const handleConsentChange = async (value: boolean) => {
    setSaving(true)
    setMessage(null)
    const result = await setMarketingConsent(value)
    setSaving(false)
    setMessage(
      result.error
        ? result.error
        : value
          ? "You're subscribed to LWK emails."
          : "You've been unsubscribed from marketing email.",
    )
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-6 py-16 lg:py-24">
        <h1 className="mb-12 text-4xl uppercase tracking-tighter">Account</h1>

        <section className="mb-12">
          <h2 className="mb-4 border-b border-border pb-2 text-sm uppercase tracking-widest text-muted-foreground">
            Profile
          </h2>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-right">{user.fullName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all text-right font-mono text-xs">{user.email}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 border-b border-border pb-2 text-sm uppercase tracking-widest text-muted-foreground">
            Email Preferences
          </h2>
          <div className="flex items-start justify-between gap-6 border border-border bg-card p-6">
            <div>
              <p className="mb-1 text-sm">Marketing email</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Drop announcements, and the occasional reminder if you leave something in your
                cart. Order confirmations and delivery updates are sent regardless, since those
                relate to purchases you've made.
              </p>
            </div>
            <Switch
              checked={Boolean(user.marketingConsent)}
              onCheckedChange={handleConsentChange}
              disabled={saving}
              aria-label="Marketing email"
            />
          </div>
          {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
        </section>

        <section>
          <h2 className="mb-4 border-b border-border pb-2 text-sm uppercase tracking-widest text-muted-foreground">
            Orders
          </h2>
          <Button variant="outline" onClick={() => setLocation("/account/orders")}>
            View order history
          </Button>
        </section>
      </div>
    </Layout>
  )
}
