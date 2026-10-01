import type { BadgeColor } from './components/Badge'
import type { MembershipType, MemberStatus } from './api'

/** Fecha de hoy como "YYYY-MM-DD" (hora local), comparable con las fechas de la API */
export const today = () => new Date().toLocaleDateString('sv-SE')

export const formatAmount = (amount: number) => amount.toFixed(2)

export const memberStatusLabel: Record<MemberStatus, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  expired: 'Caducado',
}

export const memberStatusColor: Record<MemberStatus, BadgeColor> = {
  active: 'green',
  suspended: 'red',
  expired: 'gray',
}

export const membershipTypeLabel: Record<MembershipType, string> = {
  basic: 'Básica',
  standard: 'Estándar',
  premium: 'Premium',
}

const notificationTypeLabels: Record<string, string> = {
  loan_reminder: 'Recordatorio de préstamo',
  overdue_warning: 'Aviso de retraso',
  account_suspended: 'Cuenta suspendida',
  pending_fine: 'Multa pendiente',
}

/** Tipos conocidos de notificación, para formularios */
export const notificationTypes = Object.keys(notificationTypeLabels)

/** Etiqueta en español; para tipos desconocidos convierte el snake_case en texto */
export function notificationTypeLabel(type: string): string {
  const label = notificationTypeLabels[type] ?? type.replaceAll('_', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export type BookOrder = 'titulo' | 'autor' | 'disponibles'

export const bookOrderLabel: Record<BookOrder, string> = {
  titulo: 'Título (A–Z)',
  autor: 'Autor (A–Z)',
  disponibles: 'Más ejemplares disponibles',
}

export const isBookOrder = (value: string | null): value is BookOrder => value !== null && value in bookOrderLabel

// Ignora mayúsculas y tildes, y ordena "Libro 2" antes que "Libro 10"
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

/** Devuelve una copia ordenada; a igualdad de criterio, por título */
export function sortBooks<T extends { title: string; authors: string; availableCopies: number }>(
  books: T[],
  order: BookOrder,
): T[] {
  const byTitle = (a: T, b: T) => collator.compare(a.title, b.title)
  const compare: Record<BookOrder, (a: T, b: T) => number> = {
    titulo: byTitle,
    autor: (a, b) => collator.compare(a.authors, b.authors) || byTitle(a, b),
    disponibles: (a, b) => b.availableCopies - a.availableCopies || byTitle(a, b),
  }
  return books.toSorted(compare[order])
}
