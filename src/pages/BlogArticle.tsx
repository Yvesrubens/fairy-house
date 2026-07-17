import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getArticleBySlug } from '../lib/api'
import { formatDate } from '../lib/format'
import type { Article } from '../types/db'

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading)
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-24 text-gray-500">
        Chargement…
      </main>
    )

  if (!article)
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-24 text-center">
        <h1 className="text-3xl font-bold text-ink">Article introuvable</h1>
        <Link
          to="/blog"
          className="mt-6 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black hover:bg-gold-dark"
        >
          Retour au journal
        </Link>
      </main>
    )

  return (
    <main className="pt-24">
      {article.image_url && (
        <div className="relative h-[45vh] overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      <article className="mx-auto max-w-3xl px-6 py-16">
        {article.published_at && (
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            {formatDate(article.published_at)}
          </p>
        )}
        <h1 className="mt-2 text-4xl font-bold text-ink">{article.title}</h1>
        {article.excerpt && (
          <p className="mt-4 text-lg italic text-gray-500">{article.excerpt}</p>
        )}
        <div className="mt-8 whitespace-pre-line leading-relaxed text-gray-700">
          {article.content}
        </div>
        <Link
          to="/blog"
          className="mt-12 inline-block text-sm font-medium text-gold hover:text-gold-dark"
        >
          ← Retour au journal
        </Link>
      </article>
    </main>
  )
}
