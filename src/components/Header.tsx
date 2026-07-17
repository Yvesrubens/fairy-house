import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const NAV = [
  { label: 'Accueil', to: '/' },
  { label: 'Le Lieu', to: '/le-lieu' },
  { label: 'Événements', to: '/evenements' },
  { label: 'Journal', to: '/blog' },
  { label: 'Accompagnant·es', to: '/intervenants' },
  { label: 'Contact', to: '/contact' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-24 transition-all duration-300 ${
        scrolled ? 'bg-white/95 shadow-sm backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center">
          <img
            src={scrolled ? '/logo-fonce-bg.png' : '/logo-clair-bg.png'}
            alt="Fairy House"
            className="h-16 w-auto transition-all duration-300 group-hover:scale-105"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium transition-colors hover:text-gold ${
                scrolled ? 'text-ink' : 'text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-dark"
          >
            Réserver
          </Link>
        </nav>

        <button
          className={`lg:hidden ${scrolled ? 'text-ink' : 'text-white'}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-cream bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-ink hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gold px-6 py-3 text-center text-sm font-semibold text-black"
            >
              Réserver
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
