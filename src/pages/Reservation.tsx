import { Calendar } from '../components/icons'
import ReservationForm from '../components/ReservationForm'

export default function Reservation() {
  return (
    <main className="flex-1">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-24">
        <div className="container mx-auto px-4">
          {/* En-tête */}
          <div className="max-w-2xl mx-auto text-center mb-10">
            <div className="w-16 h-16 bg-fairy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-fairy-gold" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Réserver votre séjour
            </h1>
            <p className="text-gray-600">
              Choisissez vos dates, votre hébergement et le nombre de personnes.
              Nous revenons vers vous sous 48h pour confirmer la disponibilité.
            </p>
          </div>

          {/* Formulaire inline */}
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-fairy-gold to-fairy-gold-light px-8 py-6">
              <h2 className="text-2xl font-bold text-black">
                Votre demande de réservation
              </h2>
              <p className="text-black/70 mt-1">
                Remplissez le formulaire ci-dessous
              </p>
            </div>
            <ReservationForm />
          </div>
        </div>
      </div>
    </main>
  )
}
