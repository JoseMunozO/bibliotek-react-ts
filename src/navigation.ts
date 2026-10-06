import { useLocation, useNavigate } from 'react-router'

/** Gör om en URL-parameter till ett giltigt id (positivt heltal) eller null */
export function parseId(value: string | null | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Går tillbaka till föregående sida med dess tillstånd kvar (sökning, filter …).
 * Om man kom dit direkt via URL:en finns ingen egen historik, och då går den till `fallback`.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate(fallback) : navigate(-1))
}
