import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedArticles } from '../lib/api'
import { formatDate } from '../lib/format'
import type { Article } from '../types/db'

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    listPublishedArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  function subscribe(e: FormEvent) {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-20">
          <div className="absolute inset-0">
            <img
              src="/photo/Blog.jpg"
              alt="Journal de la Fairy House"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-6">
              Journal de la Fairy House
            </h1>
            <p className="text-2xl md:text-3xl font-light max-w-3xl mx-auto">
              Un espace pour partager les histoires, les inspirations et les mouvements
              qui traversent la Fairy House au fil des saisons.
            </p>
          </div>
        </section>

        {/* FILTRES */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button className="px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all bg-fairy-gold text-black">
                Tous les articles
              </button>
            </div>
          </div>
        </section>

        {/* ARTICLES */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center text-fairy-black">
              Derniers articles
            </h2>
            {loading ? (
              <p className="text-center text-gray-500 py-12">Chargement…</p>
            ) : articles.length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                Aucun article pour le moment.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {articles.map((a) => (
                  <Link
                    key={a.id}
                    to={`/blog/${a.slug}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col"
                  >
                    {a.image_url && (
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={a.image_url}
                          alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      {a.published_at && (
                        <p className="text-sm font-semibold uppercase tracking-wider text-fairy-gold">
                          {formatDate(a.published_at)}
                        </p>
                      )}
                      <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-fairy-gold transition-colors">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="mt-3 leading-relaxed text-gray-600">{a.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* COMMUNAUTÉ */}
        <section className="py-20 bg-gradient-to-br from-fairy-gold to-fairy-gold-light text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Rejoindre la communauté</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Entrez dans le cercle de la Fairy House.
              <br />
              Recevez des nouvelles du lieu, des retraites et des mouvements qui le
              traversent au fil du temps.
            </p>
            {subscribed ? (
              <p className="max-w-xl mx-auto text-lg font-semibold">
                Merci, vous faites désormais partie du cercle ✨
              </p>
            ) : (
              <form onSubmit={subscribe} className="max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="email"
                    required
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-full bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-900 transition-all disabled:opacity-60 whitespace-nowrap"
                  >
                    Entrer dans le cercle
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
