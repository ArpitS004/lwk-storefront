import { Layout } from "@/components/layout"
import { Link } from "wouter"

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 py-24 text-center">
        <h1 className="text-8xl font-bold font-mono tracking-tighter mb-4 text-muted-foreground/20">404</h1>
        <h2 className="text-2xl uppercase tracking-widest mb-6">Page Not Found</h2>
        <p className="text-muted-foreground uppercase tracking-widest text-sm mb-12 max-w-md">
          The page you are looking for does not exist or has been moved to the archives.
        </p>
        <Link href="/shop" className="uppercase tracking-widest text-sm border-b border-primary pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors">
          Return to Shop
        </Link>
      </div>
    </Layout>
  )
}
