import { useEffect, useState } from 'react'
import { PAGES } from '../../lib/siteContent'
import { listSiteContent, upsertSiteContent } from '../../lib/api'
import ImageUpload from '../components/ImageUpload'

export default function SiteContent() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [pageKey, setPageKey] = useState(PAGES[0].key)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    listSiteContent()
      .then((rows) => {
        const v: Record<string, string> = {}
        for (const r of rows) v[r.key] = r.value ?? ''
        setValues(v)
      })
      .catch((e) => setMsg((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const page = PAGES.find((p) => p.key === pageKey)!
  const val = (key: string, def: string) => (key in values ? values[key] : def)
  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }))

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      const entries = page.sections.flatMap((s) =>
        s.fields.filter((f) => f.key in values).map((f) => ({ key: f.key, value: values[f.key] })),
      )
      await upsertSiteContent(entries)
      setMsg('Contenu enregistré.')
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Contenu du site</h1>
      <p className="mt-2 text-gray-600">
        Modifiez les textes et images des pages. Un champ vide réutilise le texte par défaut.
      </p>

      <div className="mt-6 flex gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setPageKey(p.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              pageKey === p.key ? 'bg-purple-600 text-white' : 'border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {msg && <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <div className="mt-6 space-y-8">
        {page.sections.map((s) => (
          <section key={s.label} className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">{s.label}</h2>
            <div className="mt-4 space-y-4">
              {s.fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {f.label}
                    {f.type === 'list' && (
                      <span className="ml-2 text-xs text-gray-400">(un élément par ligne)</span>
                    )}
                  </label>
                  {f.type === 'image' ? (
                    <ImageUpload
                      value={val(f.key, f.default) || null}
                      onChange={(url) => set(f.key, url ?? '')}
                    />
                  ) : f.type === 'text' ? (
                    <input
                      value={val(f.key, f.default)}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                  ) : (
                    <textarea
                      rows={f.type === 'list' ? 5 : 3}
                      value={val(f.key, f.default)}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
