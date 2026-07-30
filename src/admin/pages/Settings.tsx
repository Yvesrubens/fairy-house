import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  listAdmins,
  inviteAdmin,
  getOrgSettings,
  updateOrgSettings,
} from '../../lib/api'

const ORG_FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: 'contact_email', label: 'E-mail de contact', placeholder: 'contact@…' },
  { key: 'contact_phone', label: 'Téléphone', placeholder: '+33 …' },
  { key: 'address', label: 'Adresse' },
  { key: 'siret', label: 'SIRET' },
  { key: 'tva', label: 'N° TVA' },
  { key: 'rib_titulaire', label: 'RIB — Titulaire' },
  { key: 'rib_iban', label: 'RIB — IBAN' },
  { key: 'rib_bic', label: 'RIB — BIC' },
]
type OrgForm = Record<string, string>

export default function Settings() {
  const [admins, setAdmins] = useState<
    { id: string; email: string; full_name: string | null }[]
  >([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [org, setOrg] = useState<OrgForm>({})
  const [orgMsg, setOrgMsg] = useState('')
  const [orgBusy, setOrgBusy] = useState(false)

  async function load() {
    try {
      setAdmins(await listAdmins())
    } catch (err) {
      setError((err as Error).message)
    }
    try {
      const s = await getOrgSettings()
      if (s) {
        const raw = s as unknown as Record<string, unknown>
        const f: OrgForm = {}
        for (const { key } of ORG_FIELDS) f[key] = raw[key]?.toString() ?? ''
        f['total_beds'] = raw['total_beds']?.toString() ?? ''
        setOrg(f)
      }
    } catch {
      /* table non provisionnée : on laisse les champs vides */
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function saveOrg(e: FormEvent) {
    e.preventDefault()
    setOrgBusy(true)
    setOrgMsg('')
    try {
      const patch: Record<string, string | number | null> = {}
      for (const { key } of ORG_FIELDS) patch[key] = org[key] ?? ''
      patch['total_beds'] = org['total_beds'] ? Number(org['total_beds']) : 11
      await updateOrgSettings(
        patch as Parameters<typeof updateOrgSettings>[0],
      )
      setOrgMsg('Coordonnées enregistrées.')
    } catch (err) {
      setOrgMsg((err as Error).message)
    } finally {
      setOrgBusy(false)
    }
  }

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
        <h2 className="text-lg font-bold text-gray-900">
          Coordonnées & facturation
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ces informations apparaissent dans les e-mails, les devis et les
          factures. Un champ laissé vide utilise la valeur par défaut.
        </p>
        {orgMsg && (
          <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {orgMsg}
          </p>
        )}
        <form onSubmit={saveOrg} className="mt-4 grid gap-4 sm:grid-cols-2">
          {ORG_FIELDS.map((f) => (
            <label key={f.key} className="block text-sm font-medium text-gray-700">
              {f.label}
              <input
                value={org[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setOrg((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
            </label>
          ))}
          <label className="block text-sm font-medium text-gray-700">
            Nombre de lits de la maison
            <input
              type="number"
              min={1}
              value={org['total_beds'] ?? ''}
              placeholder="11"
              onChange={(e) =>
                setOrg((prev) => ({ ...prev, total_beds: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Utilisé pour le calcul des disponibilités.
            </span>
          </label>
          <div className="sm:col-span-2">
            <button
              disabled={orgBusy}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {orgBusy ? 'Enregistrement…' : 'Enregistrer les coordonnées'}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-6">
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
