import { useEffect } from 'react'
import { useReservation } from '../components/Reservation'
import { Calendar } from '../components/icons'

export default function Reservation() {
  const { open } = useReservation()

  // Ouvre la modale de réservation dès l'arrivée sur la page.
  useEffect(() => {
    open()
  }, [open])

  return (
    <main className="flex-1">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4 pt-32 pb-24">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 bg-fairy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-fairy-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Réserver votre séjour
          </h1>
          <p className="text-gray-600 mb-8">
            Remplissez le formulaire pour nous envoyer votre demande. Nous revenons vers
            vous sous 48h pour confirmer.
          </p>
          <button
            onClick={open}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold text-lg transition-all shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Ouvrir le formulaire
          </button>
        </div>
      </div>
    </main>
  )
}
