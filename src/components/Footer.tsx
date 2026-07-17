import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <img src="/logo-clair-bg.png" alt="Fairy House" className="mb-6 h-20 w-auto" />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Un lieu de reconnexion au corps, à l'intime et à la créativité. Un espace
              sécurisant pour se (re)découvrir.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="https://www.facebook.com/FairyHouse" className="text-white/70 hover:text-gold" aria-label="Facebook">Facebook</a>
              <a href="https://www.instagram.com/fairyhouse" className="text-white/70 hover:text-gold" aria-label="Instagram">Instagram</a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Navigation</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white">Accueil</Link></li>
              <li><Link to="/le-lieu" className="hover:text-white">Le Lieu</Link></li>
              <li><Link to="/evenements" className="hover:text-white">Événements</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link to="/intervenants" className="hover:text-white">Accompagnant·es</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Informations</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><a href="#" className="hover:text-white">Mentions légales</a></li>
              <li><a href="#" className="hover:text-white">CGV</a></li>
              <li><a href="#" className="hover:text-white">Confidentialité</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <span className="block text-white/50">Email</span>
                <a href="mailto:contact@fairyhouse.com" className="hover:text-white">contact@fairyhouse.com</a>
              </li>
              <li>
                <span className="block text-white/50">Téléphone</span>
                <a href="tel:+33123456789" className="hover:text-white">+33 1 23 45 67 89</a>
              </li>
              <li>
                <span className="block text-white/50">Adresse</span>
                Le Grand Leu<br />45230 La Chapelle sur Aveyron
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-8 text-sm text-white/50 md:flex-row">
          <p>© 2026 Fairy House. Tous droits réservés.</p>
          <p>Fait avec passion pour la reconnexion.</p>
        </div>
      </div>
    </footer>
  )
}
