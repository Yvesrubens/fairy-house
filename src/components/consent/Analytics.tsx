import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useConsent } from './ConsentContext'

// Chargement de Google Analytics 4 UNIQUEMENT après consentement « mesure
// d'audience ». Aucun script Google n'est injecté et aucun cookie `_ga` n'est
// déposé tant que la personne n'a pas donné son accord. En cas de refus ou de
// retrait, la collecte est désactivée via l'indicateur `ga-disable-<id>`.

const GA4_ID =
  (import.meta.env.VITE_GA4_ID as string | undefined) || 'G-SLF2MNXCVM'

declare global {
  interface Window {
    dataLayer?: unknown[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
    [key: string]: unknown
  }
}

function loadGa() {
  if (document.getElementById('ga4-src')) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // On gère les page_view manuellement (SPA) → pas d'auto page_view.
  window.gtag('config', GA4_ID, { send_page_view: false })

  const s = document.createElement('script')
  s.id = 'ga4-src'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
  document.head.appendChild(s)
}

export default function Analytics() {
  const { consent } = useConsent()
  const location = useLocation()

  useEffect(() => {
    if (consent.analytics) {
      window[`ga-disable-${GA4_ID}`] = false
      loadGa()
    } else {
      // Refus / retrait : bloque toute collecte même si GA a déjà été chargé.
      window[`ga-disable-${GA4_ID}`] = true
    }
  }, [consent.analytics])

  // Suivi des changements de page (navigation SPA).
  useEffect(() => {
    if (!consent.analytics || typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [location.pathname, location.search, consent.analytics])

  return null
}
