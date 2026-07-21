import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Facebook, Instagram, Calendar, Menu, Close } from './icons'

const NAV = [
  { label: 'Accueil', to: '/' },
  { label: 'Le Lieu', to: '/le-lieu' },
  { label: 'Événements', to: '/evenements' },
  { label: 'Journal', to: '/blog' },
  { label: 'Accompagnant·es', to: '/intervenants' },
  { label: 'Contact', to: '/contact' },
]

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61590986093696'
const INSTAGRAM = 'https://www.instagram.com/fairyhouse.collectif/'

export default function Header() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkColor = scrolled ? 'text-ink' : 'text-white'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 shadow-sm backdrop-blur' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img
              src={scrolled ? '/logo-clair-bg.png' : '/logo-fonce-bg.png'}
              alt="Fairy House"
              className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `font-medium transition-colors hover:text-fairy-gold ${linkColor} ${
                    isActive
                      ? 'text-fairy-gold font-bold border-b-2 border-fairy-gold'
                      : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <a
                href={FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={`${linkColor} hover:text-fairy-gold transition-colors`}
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={`${linkColor} hover:text-fairy-gold transition-colors`}
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <button
              onClick={() => navigate('/reserver')}
              className="hidden md:inline-flex items-center gap-2 bg-fairy-gold hover:bg-black text-black hover:text-fairy-gold px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <Calendar className="w-4 h-4" />
              Réserver
            </button>
            <button
              className={`lg:hidden p-2 transition-colors hover:text-fairy-gold ${linkColor}`}
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <Close className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-4 rounded-2xl border border-cream bg-white px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-4">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-ink hover:text-fairy-gold"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/reserver')
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-fairy-gold px-6 py-3 text-center text-sm font-semibold text-black"
              >
                <Calendar className="w-4 h-4" />
                Réserver
              </button>
              <div className="flex items-center gap-4 pt-2">
                <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-ink hover:text-fairy-gold">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-ink hover:text-fairy-gold">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </nav>
          </div>
        )}
      </nav>
    </header>
  )
}
