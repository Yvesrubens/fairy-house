import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import {
  DashboardIcon,
  CalendarIcon,
  ClipboardIcon,
  EnvelopeIcon,
  DocIcon,
  UsersIcon,
  GearIcon,
  BellIcon,
  SearchIcon,
  LogoutIcon,
} from './icons'

const LINKS: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: <DashboardIcon /> },
  { to: '/admin/events', label: 'Événements', icon: <CalendarIcon /> },
  { to: '/admin/reservations', label: 'Réservations', icon: <ClipboardIcon /> },
  { to: '/admin/messages', label: 'Messages', icon: <EnvelopeIcon /> },
  { to: '/admin/articles', label: 'Articles', icon: <DocIcon /> },
  { to: '/admin/intervenants', label: 'Intervenants', icon: <UsersIcon /> },
  { to: '/admin/settings', label: 'Paramètres', icon: <GearIcon /> },
]

export default function AdminLayout() {
  const { admin, signOut } = useAuth()
  const nav = useNavigate()
  const location = useLocation()

  const current = LINKS.find((l) => location.pathname.startsWith(l.to))

  async function logout() {
    await signOut()
    nav('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-purple-700">Fairy House</span>
          <span className="text-sm text-gray-400">Administration</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <SearchIcon
              width={16}
              height={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Rechercher…"
              className="w-56 rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-500"
            />
          </div>
          <button
            className="relative text-gray-500 hover:text-gray-700"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-pink-500" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
              {(admin?.full_name ?? admin?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold text-gray-800">
                {admin?.full_name ?? admin?.email}
              </div>
              <div className="text-xs text-gray-400">admin</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600"
          >
            <LogoutIcon width={16} height={16} />
            Déconnexion
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="min-h-[calc(100vh-4rem)] w-60 border-r bg-white p-4">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {l.icon}
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <span>Admin</span>
            <span>›</span>
            <span className="font-medium text-purple-600">
              {current?.label ?? ''}
            </span>
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
