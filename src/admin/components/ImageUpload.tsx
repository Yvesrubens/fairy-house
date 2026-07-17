import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { uploadMedia } from '../../lib/api'

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string | null
  onChange: (url: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handle(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const url = await uploadMedia(file)
      onChange(url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="text-sm">
      <span className="mb-1 block font-medium text-gray-700">Image</span>
      {value && (
        <img
          src={value}
          alt=""
          className="mb-2 h-32 w-full rounded-lg object-cover"
        />
      )}
      <input type="file" accept="image/*" onChange={handle} disabled={busy} />
      {busy && <p className="mt-1 text-gray-400">Téléversement…</p>}
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  )
}
