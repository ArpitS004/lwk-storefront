import { Layout } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GoogleSignInButton } from "@/components/google-signin-button"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { useLocation, Link } from "wouter"
import { Loader2 } from "lucide-react"

// The Google callback redirects here with a fixed error code rather than a
// message, so a crafted link can't make our own login page display
// arbitrary text. Anything unrecognised falls back to a generic line.
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet. Use your email and password instead.",
  google_cancelled: "Google sign-in was cancelled.",
  google_bad_state: "That sign-in link expired. Please try again.",
  google_failed: "Google sign-in didn't complete. Please try again.",
}

export default function Login() {
  const { login } = useAuth()
  const [, setLocation] = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(() => {
    const code = new URLSearchParams(window.location.search).get("error")
    if (!code) return null
    return OAUTH_ERROR_MESSAGES[code] ?? "Sign-in didn't complete. Please try again."
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setLocation("/")
  }

  return (
    <Layout>
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 text-3xl uppercase tracking-tighter">Sign In</h1>
          <GoogleSignInButton />
          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-foreground underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
