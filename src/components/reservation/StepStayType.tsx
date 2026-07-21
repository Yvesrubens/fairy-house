import type { StepProps } from './types'
import { Users, Bed } from '../icons'

/**
 * Étape 1 : choix du type de séjour. Pas de bouton retour (première étape).
 */
export default function StepStayType({ setState, onNext }: StepProps) {
  function choose(mode: 'groupe' | 'individuel') {
    setState({ mode })
    onNext()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <button
        type="button"
        onClick={() => choose('groupe')}
        className="group p-8 border-2 border-gray-200 rounded-2xl text-left hover:border-fairy-gold hover:shadow-lg transition-all"
      >
        <Users className="w-10 h-10 text-fairy-gold mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Séjour Groupe</h3>
        <p className="text-gray-600">
          Privatisez une ou plusieurs chambres, ou la maison entière, pour votre
          groupe, votre famille ou votre événement.
        </p>
      </button>
      <button
        type="button"
        onClick={() => choose('individuel')}
        className="group p-8 border-2 border-gray-200 rounded-2xl text-left hover:border-fairy-gold hover:shadow-lg transition-all"
      >
        <Bed className="w-10 h-10 text-fairy-gold mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Séjour Individuel
        </h3>
        <p className="text-gray-600">
          Réservez simplement un ou plusieurs lits, seul(e) ou entre ami(e)s.
        </p>
      </button>
    </div>
  )
}
