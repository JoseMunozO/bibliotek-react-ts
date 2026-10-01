import { useLocation, useNavigate } from 'react-router'

/** Convierte un parámetro de la URL en un id válido (entero positivo) o null */
export function parseId(value: string | null | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Vuelve a la página anterior conservando su estado (búsqueda, filtros...).
 * Si se entró directamente por la URL no hay historial propio y va a `fallback`.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate(fallback) : navigate(-1))
}
