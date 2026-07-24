import { ReactNode } from "react"
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { CartDrawer } from "./cart-drawer"

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <CartDrawer />
      <main className="flex-1 flex flex-col pt-20">
        {children}
      </main>
      <Footer />
    </div>
  )
}
