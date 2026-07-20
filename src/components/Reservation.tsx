import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Close } from './icons'
import ReservationForm from './ReservationForm'
import type { ReservationContext } from './ReservationForm'

interface ReservationValue {
  open: (ctx?: ReservationContext) => void
  close: () => void
}

const Ctx = createContext<ReservationValue | undefined>(undefined)

export function useReservation(): ReservationValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useReservation must be used within ReservationProvider')
  return v
}

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [ctx, setCtx] = useState<ReservationContext | null>(null)

  const open = useCallback((context?: ReservationContext) => {
    setCtx(context ?? null)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  const isEvent = Boolean(ctx?.eventId)

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-fairy-gold to-fairy-gold-light p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-black">
                    {isEvent ? 'Réserver votre place' : 'Réserver votre séjour'}
                  </h2>
                  <p className="text-black/70 mt-1">
                    {isEvent
                      ? ctx?.eventTitle
                      : 'Remplissez le formulaire ci-dessous'}
                  </p>
                </div>
                <button
                  onClick={close}
                  aria-label="Fermer"
                  className="w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <Close className="w-6 h-6 text-black" />
                </button>
              </div>
            </div>

            {/* La clé force le remontage du formulaire à chaque ouverture,
                ce qui réinitialise l'état et applique le contexte éventuel. */}
            <ReservationForm key={ctx?.eventId ?? 'sejour'} ctx={ctx} onCancel={close} />
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
