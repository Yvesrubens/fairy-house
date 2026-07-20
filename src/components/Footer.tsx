import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, Phone, MapPin, Heart } from './icons'

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61590986093696'
const INSTAGRAM = 'https://www.instagram.com/fairyhouse.collectif/'

function Bar() {
  return <span className="w-1 h-6 bg-fairy-gold rounded-full" />
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-100 to-gray-50 border-t-2 border-fairy-gold/30">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Marque */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img
                src="/logo-clair-bg.png"
                alt="Fairy House"
                className="h-20 w-auto hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Un lieu de reconnexion au corps, à l'intime et à la créativité. Un espace
              sécurisant pour se (re)découvrir.
            </p>
            <div className="flex gap-3">
              <a
                href={FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 bg-fairy-gold/10 hover:bg-fairy-gold border border-fairy-gold/20 hover:border-fairy-gold rounded-lg flex items-center justify-center transition-all group"
              >
                <Facebook className="w-5 h-5 text-gray-700 group-hover:text-black" />
              </a>
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 bg-fairy-gold/10 hover:bg-fairy-gold border border-fairy-gold/20 hover:border-fairy-gold rounded-lg flex items-center justify-center transition-all group"
              >
                <Instagram className="w-5 h-5 text-gray-700 group-hover:text-black" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-6 text-lg flex items-center gap-2">
              <Bar />
              Navigation
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                { label: 'Accueil', to: '/' },
                { label: 'Le Lieu', to: '/le-lieu' },
                { label: 'Événements', to: '/evenements' },
                { label: 'Blog', to: '/blog' },
                { label: 'Accompagnant·es', to: '/intervenants' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="hover:text-fairy-gold transition-colors hover:translate-x-1 inline-block font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-6 text-lg flex items-center gap-2">
              <Bar />
              Informations
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link
                  to="/contact"
                  className="hover:text-fairy-gold transition-colors hover:translate-x-1 inline-block font-medium"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-fairy-gold transition-colors hover:translate-x-1 inline-block font-medium"
                >
                  FAQ
                </Link>
              </li>
              {[
                { label: 'Mentions légales', to: '/mentions-legales' },
                { label: 'CGV', to: '/cgv' },
                { label: 'Confidentialité', to: '/confidentialite' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="hover:text-fairy-gold transition-colors hover:translate-x-1 inline-block font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-6 text-lg flex items-center gap-2">
              <Bar />
              Contact
            </h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3 group">
                <Mail className="w-5 h-5 text-fairy-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-gray-500 text-xs mb-1 font-semibold">Email</div>
                  <a
                    href="mailto:fairyhouse.collectif@gmail.com"
                    className="hover:text-fairy-gold transition-colors font-medium"
                  >
                    fairyhouse.collectif@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <Phone className="w-5 h-5 text-fairy-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-gray-500 text-xs mb-1 font-semibold">
                    Téléphone
                  </div>
                  <a
                    href="tel:+33671398807"
                    className="hover:text-fairy-gold transition-colors font-medium"
                  >
                    +33 6 71 39 88 07
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 text-fairy-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-gray-500 text-xs mb-1 font-semibold">Adresse</div>
                  <span className="font-medium">
                    2 Le Grand Leu
                    <br />
                    45230 La Chapelle sur Aveyron
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-fairy-gold/30 mt-16 pt-8">
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 text-sm text-gray-600 text-center md:text-left">
            <p className="flex items-center gap-2 font-medium">
              © 2026 Fairy House. Tous droits réservés.
              <Heart className="w-4 h-4 text-fairy-gold inline" />
            </p>
            <p className="text-xs text-gray-500">
              Fait avec passion pour la reconnexion à soi —{' '}
              <span className="text-fairy-gold font-semibold">
                Un projet porté par Fairy Mortelle
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
