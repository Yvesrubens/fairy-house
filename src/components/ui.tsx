import { Link } from 'react-router-dom'

export function Eyebrow({ children }: { children: string }) {
  return (
    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gold">
      {children}
    </p>
  )
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image = '/photo/Vue_coucher_de_soleil.jpg',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  image?: string
}) {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden pt-24">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center text-white">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

export function CTASection({
  title,
  text,
  cta = 'Nous contacter',
  to = '/reserver',
}: {
  title: string
  text?: string
  cta?: string
  to?: string
}) {
  return (
    <section className="bg-ink py-24 text-center text-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {text && <p className="mt-6 text-lg leading-relaxed text-white/80">{text}</p>}
        <Link
          to={to}
          className="mt-10 inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold text-black transition-colors hover:bg-gold-dark"
        >
          {cta}
        </Link>
      </div>
    </section>
  )
}
