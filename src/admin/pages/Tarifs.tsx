import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getTarifs, updateTarifs } from '../../lib/api'
import { pricesFromRow } from '../../lib/booking'
import type { Prices } from '../../lib/booking'
import { formatDate, formatEuro2 } from '../../lib/format'
import { invalidatePrices } from '../../lib/usePrices'

// Tarifs du tunnel de réservation, modifiables sans intervention technique.
// Prix TTC (TVA 10 %) ; le HT est recalculé automatiquement sur les devis et
// factures. Les réservations déjà enregistrées gardent leur prix d'origine.

const FIELDS: { key: keyof Prices; label: string; help: string }[] = [
  {
    key: 'litNuit',
    label: 'Lit simple — par personne et par nuit',
    help: 'Le lit double est facturé 2 × ce montant.',
  },
  {
    key: 'linge',
    label: 'Linge de maison — par personne',
    help: 'Forfait pour tout le séjour (pas par nuit).',
  },
  {
    key: 'pensionNuit',
    label: 'Pension complète — par personne et par nuit',
    help: '',
  },
  {
    key: 'maisonNuit',
    label: 'Maison complète — forfait par nuit',
    help: 'Privatisation, indépendante du nombre de personnes.',
  },
]

export default function Tarifs() {
  const [values, setValues] = useState<Record<keyof Prices, string>>({
    litNuit: '',
    linge: '',
    pensionNuit: '',
    maisonNuit: '',
  })
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getTarifs()
      .then((row) => {
        const p = pricesFromRow(row)
        setValues({
          litNuit: String(p.litNuit),
          linge: String(p.linge),
          pensionNuit: String(p.pensionNuit),
          maisonNuit: String(p.maisonNuit),
        })
        setUpdatedAt(row?.updated_at ?? null)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  async function save(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    const nums = {} as Prices
    for (const f of FIELDS) {
      const n = Number(String(values[f.key]).replace(',', '.'))
      if (!Number.isFinite(n) || n < 0 || values[f.key].trim() === '') {
        setError(`Montant invalide pour « ${f.label} ».`)
        return
      }
      nums[f.key] = Math.round(n * 100) / 100
    }
    setBusy(true)
    try {
      await updateTarifs({
        lit_nuit_ttc: nums.litNuit,
        linge_ttc: nums.linge,
        pension_nuit_ttc: nums.pensionNuit,
        maison_nuit_ttc: nums.maisonNuit,
      })
      invalidatePrices()
      setUpdatedAt(new Date().toISOString())
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Tarifs</h1>
      <p className="mt-2 text-sm text-gray-600">
        Prix <strong>TTC</strong> appliqués dans le tunnel de réservation (TVA 10 % incluse).
        Le HT est recalculé automatiquement sur les devis et factures. Les réservations
        déjà enregistrées conservent leur prix d'origine.
      </p>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border bg-white p-6">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            Tarifs enregistrés. Ils s'appliquent aux nouvelles réservations.
          </p>
        )}

        {FIELDS.map((f) => {
          const n = Number(String(values[f.key]).replace(',', '.'))
          return (
            <label key={f.key} className="block text-sm font-medium text-gray-700">
              {f.label}
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-40 rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
                />
                <span className="text-gray-500">€ TTC</span>
                {f.key === 'litNuit' && Number.isFinite(n) && (
                  <span className="text-xs text-gray-400">→ lit double : {formatEuro2(n * 2)}</span>
                )}
              </div>
              {f.help && <span className="mt-1 block text-xs text-gray-400">{f.help}</span>}
            </label>
          )
        })}

        <button
          disabled={busy}
          className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer les tarifs'}
        </button>
        {updatedAt && (
          <p className="text-xs text-gray-400">Dernière modification : {formatDate(updatedAt)}</p>
        )}
      </form>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ Pensez aussi à mettre à jour les <strong>textes</strong> qui mentionnent les prix
        (page « Le Lieu », bloc Séjour) dans{' '}
        <Link to="/admin/contenu" className="font-semibold underline">
          Contenu du site
        </Link>
        .
      </div>
    </div>
  )
}
