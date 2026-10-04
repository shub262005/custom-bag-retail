import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, Home, LogOut, Menu, Palette, UserRound, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { storefrontConfig } from '../../config/storefrontConfig'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${
    isActive ? 'bg-rose-100 text-red-700 shadow-sm' : 'text-slate-600 hover:-translate-y-0.5 hover:bg-rose-50 hover:text-red-700'
  }`

export function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isCustomer = user?.role === 'CUSTOMER'
  const isHome = location.pathname === '/home'

  const closeMenu = () => setMobileOpen(false)
  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/home', { replace: true })
  }

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-rose-200/80 bg-white/92 shadow-[0_4px_24px_rgba(190,18,60,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/home" className="flex min-w-0 items-center gap-3" onClick={closeMenu}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-rose-200 bg-white p-1 shadow-md shadow-rose-100 transition-transform duration-300 hover:rotate-3 hover:scale-105">
              <img src="/roopam-logo.png" alt="" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">
                {storefrontConfig.storeName}
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-orange-600">
                {storefrontConfig.establishedText}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Customer navigation">
            <NavLink to="/home" className={navClass}><Home className="mr-1.5 inline h-4 w-4" />Home</NavLink>
            <NavLink to="/custom-bag" className={navClass}><Palette className="mr-1.5 inline h-4 w-4" />Custom Bag</NavLink>
            {isCustomer && <NavLink to="/my-custom-bags" className={navClass}><ClipboardList className="mr-1.5 inline h-4 w-4" />My Requests</NavLink>}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {!isCustomer && (
                  <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-rose-50">
                    Staff dashboard
                  </Link>
                )}
                <span className="flex max-w-44 items-center gap-2 border-l border-slate-200 pl-3 text-sm font-semibold text-slate-700">
                  <UserRound className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.name}</span>
                </span>
                <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log in</Link>
                <Link to="/register" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg">Create account</Link>
              </>
            )}
          </div>

          <button type="button" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="customer-mobile-menu" aria-label="Toggle navigation">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div id="customer-mobile-menu" className="border-t border-rose-200 bg-white px-4 py-4 shadow-lg md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile customer navigation">
              <NavLink to="/home" className={navClass} onClick={closeMenu}>Home</NavLink>
              <NavLink to="/custom-bag" className={navClass} onClick={closeMenu}>Custom Bag Designer</NavLink>
              {isCustomer && <NavLink to="/my-custom-bags" className={navClass} onClick={closeMenu}>My Requests</NavLink>}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
                {user ? (
                  <>
                    {!isCustomer && <Link to="/dashboard" onClick={closeMenu} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold">Staff dashboard</Link>}
                    <button type="button" onClick={handleLogout} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenu} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold">Log in</Link>
                    <Link to="/register" onClick={closeMenu} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white">Register</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className={isHome ? '' : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>

      <footer className="border-t border-rose-900 bg-rose-950 text-rose-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
          <div>
            <p className="text-lg font-bold text-white">{storefrontConfig.storeName}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-rose-200/70">{storefrontConfig.tagline}</p>
            {storefrontConfig.address && <p className="mt-3 text-sm">{storefrontConfig.address}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-300/70">Customer links</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
              <Link to="/home" className="hover:text-white">Home</Link>
              <Link to="/custom-bag" className="hover:text-white">Custom Bag Designer</Link>
              <Link to="/my-custom-bags" className="hover:text-white">My Requests</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-rose-900 px-4 py-4 text-center text-xs text-rose-300/60">
          © {new Date().getFullYear()} {storefrontConfig.storeName}. In-store discovery and custom bag requests.
        </div>
      </footer>
    </div>
  )
}
