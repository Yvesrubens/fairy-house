import { useState } from 'react'
import type { FormEvent } from 'react'
import { subscribeNewsletter } from '../lib/api'

interface Props {
  /** D'où vient l'inscription (ex : 'journal', 'evenements') — stocké en base. */
  source?: string
  /** Style clair (sur fond sombre/coloré) ou sombre (sur fond clair). */
  variant?: 'light' | 'dark'
  buttonLabel?: string
  successLabel?: string
}

/**
 * Formulaire d'inscription à la newsletter.
 * Enregistre l'adresse dans la table `newsletter_subscribers`.
 * Les adresses sont consultables dans l'admin (menu « Newsletter »).
 */
export default function NewsletterForm({
  source,
  variant = 'light',
  buttonLabel = 'Entrer dans le cercle',
  successLabel = 'Merci, vous faites désormais partie du cercle ✨',
}: Props) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email) return
    setBusy(true)
    setError('')
    try {
      await subscribeNewsletter(email, source)
      setSubscribed(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (subscribed) {
    return (
      <p
        className={`text-lg font-semibold ${
          variant === 'light' ? 'text-white' : 'text-gray-800'
        }`}
      >
        {successLabel}
      </p>
    )
  }

  const inputCls =
    variant === 'light'
      ? 'flex-1 px-6 py-4 rounded-full bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white'
      : 'flex-1 px-6 py-4 rounded-full bg-white text-gray-900 placeholder:text-gray-400 border-2 border-fairy-gold/40 focus:outline-none focus:ring-2 focus:ring-fairy-gold'

  const btnCls =
    variant === 'light'
      ? 'px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-900 transition-all disabled:opacity-60 whitespace-nowrap'
      : 'px-8 py-4 bg-fairy-gold text-black rounded-full font-bold hover:bg-black hover:text-fairy-gold transition-all disabled:opacity-60 whitespace-nowrap'

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <button type="submit" disabled={busy} className={btnCls}>
          {busy ? 'Inscription…' : buttonLabel}
        </button>
      </div>
      {error && (
        <p
          className={`mt-2 text-sm ${
            variant === 'light' ? 'text-white/90' : 'text-red-600'
          }`}
        >
          {error}
        </p>
      )}
    </form>
  )
}
