import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      nav('/admin/dashboard')
    } catch (err) {
      setError((err as Error).message || 'Échec de la connexion')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-fuchsia-50 px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-purple-700">
          Fairy House{' '}
          <span className="text-base font-normal text-gray-400">
            Administration
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Connectez-vous pour accéder au tableau de bord.
        </p>
        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
          />
        </label>
        <button
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-purple-600 py-2.5 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
