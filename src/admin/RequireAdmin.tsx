import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading)
    return <div className="p-10 text-center text-gray-500">Chargement…</div>
  if (!admin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
