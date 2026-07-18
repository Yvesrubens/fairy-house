import { useState } from 'react'
import type { FormEvent } from 'react'
import { createMessage } from '../lib/api'
import { Mail, MapPin, Send, Facebook, Instagram } from '../components/icons'

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61590986093696'
const INSTAGRAM = 'https://www.instagram.com/fairyhouse.collectif/'

const inputCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-fairy-gold focus:ring-2 focus:ring-fairy-gold/20 outline-none transition-all'

export default function Contact() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    subject: 'Réservation',
    body: '',
  })
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createMessage({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        subject: form.subject,
        body: form.body,
      })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-20">
          <div className="absolute inset-0">
            <img
              src="/photo/PXL_20260101_081856561.jpg"
              alt="Nous contacter"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              Nous contacter
            </h1>
            <p className="text-lg md:text-2xl font-light max-w-3xl mx-auto">
              Une question, une envie, un projet ?
              <br />
              Écrivez-nous pour échanger autour de la Fairy House, des retraites ou des
              expériences que vous aimeriez y imaginer.
            </p>
          </div>
        </section>

        {/* FORMULAIRE + INFOS */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-12">
              {/* Formulaire */}
              <div className="md:col-span-3">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
                  <h2 className="text-3xl font-bold mb-8 text-fairy-black">
                    Écrivez-nous
                  </h2>
                  {done ? (
                    <p className="rounded-lg bg-green-50 px-4 py-12 text-center text-green-700">
                      Merci ! Votre message a bien été envoyé. Nous vous répondrons dans
                      les 48 heures.
                    </p>
                  ) : (
                    <form className="space-y-6" onSubmit={submit}>
                      {error && (
                        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                          {error}
                        </p>
                      )}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.first_name}
                            onChange={(e) => set('first_name', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nom *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.last_name}
                            onChange={(e) => set('last_name', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => set('email', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => set('phone', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sujet
                        </label>
                        <select
                          value={form.subject}
                          onChange={(e) => set('subject', e.target.value)}
                          className={inputCls}
                        >
                          <option>Réservation</option>
                          <option>Événement</option>
                          <option>Résidence artistique</option>
                          <option>Intervenant</option>
                          <option>Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Votre message *
                        </label>
                        <textarea
                          rows={8}
                          required
                          placeholder="Décrivez votre demande..."
                          value={form.body}
                          onChange={(e) => set('body', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {busy ? 'Envoi…' : 'Envoyer le message'}
                        <Send className="w-5 h-5" />
                      </button>
                      <p className="text-sm text-gray-500 text-center">
                        Nous vous répondrons dans les 48 heures
                      </p>
                    </form>
                  )}
                </div>
              </div>

              {/* Infos */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-fairy-black">
                    Informations de contact
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-fairy-gold" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Email</h4>
                        <a
                          href="mailto:contact@fairyhousecollectif.com"
                          className="text-gray-600 hover:text-fairy-gold transition-colors"
                        >
                          contact@fairyhousecollectif.com
                        </a>
                        <p className="text-sm text-gray-500 mt-1">Réponse sous 48h</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-fairy-gold" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Adresse</h4>
                        <p className="text-gray-600">
                          Le Grand Leu
                          <br />
                          45230 La Chapelle sur Aveyron
                          <br />
                          France
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <h4 className="font-bold mb-3 text-fairy-black">Réseaux sociaux</h4>
                  <div className="flex gap-3">
                    <a
                      href={FACEBOOK}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-10 h-10 bg-fairy-gold/10 rounded-lg flex items-center justify-center hover:bg-fairy-gold transition-all group"
                    >
                      <Facebook className="w-5 h-5 text-gray-700 group-hover:text-black" />
                    </a>
                    <a
                      href={INSTAGRAM}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-10 h-10 bg-fairy-gold/10 rounded-lg flex items-center justify-center hover:bg-fairy-gold transition-all group"
                    >
                      <Instagram className="w-5 h-5 text-gray-700 group-hover:text-black" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CARTE */}
        <section className="h-96 bg-gray-200">
          <iframe
            src="https://www.google.com/maps?q=Le+Grand+Leu,+45230+La+Chapelle-sur-Aveyron&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localisation Fairy House"
          />
        </section>
      </div>
    </main>
  )
}
