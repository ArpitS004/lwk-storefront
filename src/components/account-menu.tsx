import { Link, useLocation } from "wouter"
import { User, Package, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Account control in the navbar.
 *
 * Replaces a plain button whose onClick was `logout` — clicking your own
 * name signed you straight out, with no confirmation and no way to reach
 * anything else. Logout is now one deliberate item inside a menu.
 */
export function AccountMenu() {
  const { user, logout } = useAuth()
  const [, setLocation] = useLocation()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    setLocation("/")
  }

  const displayName = user.fullName?.split(" ")[0] || user.email.split("@")[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-white/80 outline-none transition-colors duration-300 hover:text-white focus-visible:text-white"
          aria-label="Account menu"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-[22px] w-[22px] rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          )}
          <span className="hidden text-xs tracking-wide text-white/60 sm:inline">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Signed in as</p>
          <p className="mt-1 truncate text-sm">{user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account/orders" className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        {user.isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
