import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReservationDetail from './ReservationDetail'
import type { Reservation } from '../../types/db'

const base: Reservation = {
  id: '1', reference: 'FH-2026-00001', client_name: 'Alice Martin',
  client_email: 'alice@ex.fr', client_phone: '0600000000', type: 'Séjour',
  arrival_date: '2026-08-01', departure_date: '2026-08-03', guests: 2,
  amount: 480, status: 'pending', message: 'Merci !', event_id: null,
  mode: 'groupe', rooms: { wholeHouse: true }, beds: null,
  options: { linge: true, pension: false }, activities_requested: true,
  allergies: 'Arachides', payment_method: 'virement', payment_plan: 'split',
  total_ht: null, vat_rate: null, total_ttc: null, deposit_amount: 240,
  balance_amount: 240, balance_due_date: '2026-07-20', confirmation_sent_at: null,
  social_handle: null, emergency_contact: null, diet: null,
  accommodation_choice: null, shuttle: null, consent_reglement: null,
  consent_image: null, quote_lines: null, vat_breakdown: null,
  created_at: '2026-07-01T10:00:00Z',
}

describe('ReservationDetail (séjour)', () => {
  it('affiche client, formule et montant', () => {
    render(<ReservationDetail reservation={base} onClose={() => {}} />)
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('FH-2026-00001')).toBeInTheDocument()
    expect(screen.getByText('Groupe')).toBeInTheDocument()
    expect(screen.getByText('Maison entière')).toBeInTheDocument()
    expect(screen.getByText('480,00 €')).toBeInTheDocument()
  })

  it('ferme via Échap', () => {
    const onClose = vi.fn()
    render(<ReservationDetail reservation={base} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("masque les infos d'événement pour un séjour", () => {
    render(<ReservationDetail reservation={base} onClose={() => {}} />)
    expect(screen.queryByText(/Hébergement/i)).not.toBeInTheDocument()
  })
})

describe('ReservationDetail (événement)', () => {
  it('affiche hébergement et régime', () => {
    const evt: Reservation = {
      ...base, event_id: 'e1', type: 'Retraite bien-être', rooms: null,
      accommodation_choice: 'tente', diet: 'Végétarien', shuttle: true,
      consent_reglement: true, consent_image: false,
    }
    render(<ReservationDetail reservation={evt} onClose={() => {}} />)
    expect(screen.getByText('En tente')).toBeInTheDocument()
    expect(screen.getByText('Végétarien')).toBeInTheDocument()
  })
})
