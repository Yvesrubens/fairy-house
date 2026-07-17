import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero, CTASection } from '../components/ui'
import { listPublishedArticles } from '../lib/api'
import { formatDate } from '../lib/format'
import type { Article } from '../types/db'

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublishedArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      <PageHero
        eyebrow="JOURNAL"
        title="Journal de la Fairy House"
        subtitle="Un espace pour partager les histoires, les inspirations et les mouvements qui traversent la Fairy House au fil des saisons."
        image="/photo/PXL_20260320_085953235.jpg"
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-ink sm:text-4xl">
            Derniers articles
          </h2>
          {loading ? (
            <p className="mt-10 text-center text-gray-500">Chargement…</p>
          ) : articles.length === 0 ? (
            <p className="mx-auto mt-10 max-w-4xl rounded-2xl border border-cream bg-cream-light px-8 py-16 text-center text-lg text-gray-500">
              Aucun article pour le moment.
            </p>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to={`/blog/${a.slug}`}
                  className="group overflow-hidden rounded-2xl border border-cream bg-white transition-shadow hover:shadow-xl"
                >
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="p-6">
                    {a.published_at && (
                      <p className="text-sm font-semibold uppercase tracking-wider text-gold">
                        {formatDate(a.published_at)}
                      </p>
                    )}
                    <h3 className="mt-2 text-xl font-bold text-ink">{a.title}</h3>
                    {a.excerpt && (
                      <p className="mt-3 leading-relaxed text-gray-600">
                        {a.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <CTASection
        title="Rejoindre la communauté"
        text="Entrez dans le cercle de la Fairy House. Recevez des nouvelles du lieu, des retraites et des mouvements qui le traversent au fil du temps."
        cta="Entrer dans le cercle"
      />
    </main>
  )
}
