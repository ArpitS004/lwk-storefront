import * as React from "react"
import { Link, useLocation } from "wouter"
import { ShoppingBag, Heart, Menu, X, Search, User } from "lucide-react"
import { useCart } from "@/lib/cart"
import { useWishlist } from "@/lib/wishlist"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [logoFailed, setLogoFailed] = React.useState(false)
  const { items: cartItems, setIsOpen: setCartOpen } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { user, loading: authLoading, logout } = useAuth()
  const [location] = useLocation()

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const navLinks = [
    { href: "/shop", label: "New Drop" },
    { href: "/collections/lowkey-always", label: "Collections" },
    { href: "/lookbook", label: "Lookbook" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  // The navbar goes transparent-over-image on pages that open with a
  // full-bleed dark hero (home + collection pages). Every other page has
  // a light background, so it must stay solid there or the white
  // text/logo becomes invisible against it.
  const hasDarkHero = location === "/" || location.startsWith("/collections/")
  const isTransparent = hasDarkHero && !isScrolled && !mobileMenuOpen

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-40 transition-all duration-500 ease-out",
        isTransparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-white/10 bg-black/90 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]",
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-6 md:px-10 lg:px-16">
        {/* Logo — left corner, wordmark + tagline */}
        <div className="flex items-center gap-4">
          <button
            className="text-white/90 transition-colors hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-3">
            {logoFailed ? (
              <span className="text-2xl font-black uppercase tracking-tight text-white">
                LWK<span className="text-[hsl(355,70%,58%)]">*</span>
              </span>
            ) : (
              <img
                src="/lwk-wordmark.png"
                alt="LWK*"
                className="h-9 w-auto object-contain"
                onError={() => setLogoFailed(true)}
              />
            )}
            <span className="hidden h-8 w-px bg-white/20 sm:block" />
            <span className="hidden flex-col text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-white/55 sm:flex">
              <span>Lowkey. Always.</span>
              <span>Estd. 2026</span>
            </span>
          </Link>
        </div>

        {/* Nav links — center */}
        <nav className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 hover:text-white",
                "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full",
                location === link.href ? "text-white after:w-full" : "text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions — right */}
        <div className="flex items-center gap-5 sm:gap-6">
          <ThemeToggle />

          {!authLoading && (
            user ? (
              <button
                onClick={logout}
                title={`Signed in as ${user.email} — click to log out`}
                className="flex items-center gap-1.5 text-white/80 transition-colors duration-300 hover:text-white"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <span className="hidden text-xs tracking-wide text-white/60 sm:inline">
                  {user.email.split("@")[0]}
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className="text-white/80 transition-colors duration-300 hover:text-white"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>
            )
          )}

          <Link
            href="/shop"
            className="hidden text-white/80 transition-colors duration-300 hover:text-white sm:flex"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <Link
            href="/wishlist"
            className="relative text-white/80 transition-colors duration-300 hover:text-white"
          >
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(355,70%,45%)] text-[9px] font-medium text-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-1.5 text-white/80 transition-colors duration-300 hover:text-white"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="text-xs tracking-wide text-white/60">
              ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 top-20 border-t border-white/10 bg-black/95 px-6 py-8 backdrop-blur-2xl backdrop-saturate-150 transition-transform duration-300 ease-in-out md:hidden",
          "flex flex-col gap-6",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-2xl uppercase tracking-wider text-white"
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-auto flex flex-col gap-4 text-sm uppercase tracking-widest text-white/60">
          {user ? (
            <button onClick={logout} className="text-left">
              Log Out ({user.email.split("@")[0]})
            </button>
          ) : (
            <Link href="/login">Sign In</Link>
          )}
          <Link href="/wishlist">Wishlist ({wishlistItems.length})</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <div className="flex items-center gap-2 pt-2">
            <ThemeToggle />
            <span>Theme</span>
          </div>
        </div>
      </div>
    </header>
  )
}
