import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Remet la page en haut à chaque changement de route.
 * Sans cela, React Router conserve la position de défilement
 * précédente et l'on peut « arriver » en bas d'une nouvelle page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
