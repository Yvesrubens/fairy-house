import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { listAdmins, inviteAdmin } from '../../lib/api'

export default function Settings() {
  const [admins, setAdmins] = useState<
    { id: string; email: string; full_name: string | null }[]
  >([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setAdmins(await listAdmins())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function invite(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await inviteAdmin(email)
      setMessage(
        `Invitation envoyée à ${email}. La personne recevra un lien de connexion par email.`,
      )
      setEmail('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>

      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Administrateurs</h2>
        <ul className="mt-4 divide-y">
          {admins.map((a) => (
            <li key={a.id} className="flex justify-between py-3 text-sm">
              <span className="font-medium text-gray-800">
                {a.full_name ?? '—'}
              </span>
              <span className="text-gray-500">{a.email}</span>
            </li>
          ))}
          {admins.length === 0 && (
            <li className="py-3 text-sm text-gray-500">Aucun administrateur.</li>
          )}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">
          Inviter un administrateur
        </h2>
        {message && (
          <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <form onSubmit={invite} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="email@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Envoi…' : 'Inviter'}
          </button>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Après la première connexion de la personne invitée, un administrateur
          doit l'ajouter à la table <code>admins</code> depuis Supabase (SQL
          Editor) :
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
{`insert into admins (id, email, full_name)
select id, email, 'Nom Prénom'
from auth.users where email = 'email@exemple.fr';`}
        </pre>
      </section>
    </div>
  )
}
