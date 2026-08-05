import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle } from '../components/icons'
import { listPublishedFaq } from '../lib/api'
import type { Faq as FaqRow } from '../types/db'

export default function Faq() {
  const [items, setItems] = useState<FaqRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublishedFaq()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-fairy-black">
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <div className="w-16 h-16 bg-fairy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-fairy-gold" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Questions fréquentes</h1>
            <p className="text-lg md:text-xl font-light text-white/70 max-w-2xl mx-auto">
              Tout ce que vous devez savoir sur la Fairy House
            </p>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4 max-w-3xl">
            {loading ? (
              <p className="text-center py-20 text-gray-400">Chargement…</p>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Le contenu de la FAQ arrive bientôt.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <details
                    key={item.id}
                    className="group rounded-2xl border-2 border-gray-200 bg-white transition-colors open:border-fairy-gold/50"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 font-semibold text-gray-900 list-none">
                      <span>{item.question}</span>
                      <span className="flex-shrink-0 text-fairy-gold transition-transform duration-300 group-open:rotate-45 text-2xl leading-none">
                        +
                      </span>
                    </summary>
                    <div className="px-6 pb-5 -mt-1 text-gray-600 leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">
                Vous n'avez pas trouvé la réponse à votre question ?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg"
              >
                Contactez-nous
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
