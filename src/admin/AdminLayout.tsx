import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const LINKS = [
  { to: '/admin/dashboard', label: 'Tableau de bord' },
  { to: '/admin/events', label: 'Événements' },
  { to: '/admin/reservations', label: 'Réservations' },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/intervenants', label: 'Intervenants' },
  { to: '/admin/settings', label: 'Paramètres' },
]

export default function AdminLayout() {
  const { admin, signOut } = useAuth()
  const nav = useNavigate()

  async function logout() {
    await signOut()
    nav('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-purple-700">Fairy House</span>
          <span className="text-sm text-gray-400">Administration</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {admin?.full_name ?? admin?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm font-medium text-red-500 hover:text-red-600"
          >
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
                  `rounded-lg px-4 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
