import type { BadgeColor } from './components/Badge'
import type { MembershipType, MemberStatus } from './api'

/** Dagens datum som "YYYY-MM-DD" (lokal tid), jämförbart med API:ts datum */
export const today = () => new Date().toLocaleDateString('sv-SE')

export const formatAmount = (amount: number) => amount.toFixed(2)

export const memberStatusLabel: Record<MemberStatus, string> = {
  active: 'Aktiv',
  suspended: 'Avstängd',
  expired: 'Utgången',
}

export const memberStatusColor: Record<MemberStatus, BadgeColor> = {
  active: 'green',
  suspended: 'red',
  expired: 'gray',
}

export const membershipTypeLabel: Record<MembershipType, string> = {
  basic: 'Bas',
  standard: 'Standard',
  premium: 'Premium',
}

const notificationTypeLabels: Record<string, string> = {
  loan_reminder: 'Lånepåminnelse',
  overdue_warning: 'Förseningsvarning',
  account_suspended: 'Kontot avstängt',
  pending_fine: 'Obetalda böter',
}

/** Kända aviseringstyper, för formulär */
export const notificationTypes = Object.keys(notificationTypeLabels)

/** Etikett på svenska; okända typer görs om från snake_case till text */
export function notificationTypeLabel(type: string): string {
  const label = notificationTypeLabels[type] ?? type.replaceAll('_', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export type BookOrder = 'titel' | 'forfattare' | 'tillgangliga'

export const bookOrderLabel: Record<BookOrder, string> = {
  titel: 'Titel (A–Ö)',
  forfattare: 'Författare (A–Ö)',
  tillgangliga: 'Flest lediga exemplar',
}

export const isBookOrder = (value: string | null): value is BookOrder => value !== null && value in bookOrderLabel

// Svensk ordning (å, ä, ö efter z) utan hänsyn till versaler, och "Bok 2" före "Bok 10"
const collator = new Intl.Collator('sv', { sensitivity: 'base', numeric: true })

/** Returnerar en sorterad kopia; vid lika värden sorteras på titel */
export function sortBooks<T extends { title: string; authors: string; availableCopies: number }>(
  books: T[],
  order: BookOrder,
): T[] {
  const byTitle = (a: T, b: T) => collator.compare(a.title, b.title)
  const compare: Record<BookOrder, (a: T, b: T) => number> = {
    titel: byTitle,
    forfattare: (a, b) => collator.compare(a.authors, b.authors) || byTitle(a, b),
    tillgangliga: (a, b) => b.availableCopies - a.availableCopies || byTitle(a, b),
  }
  return books.toSorted(compare[order])
}

/** Delar upp `items` i sidor om `size`; en sida utanför intervallet justeras till den närmaste */
export function paginate<T>(items: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages)
  const start = (current - 1) * size
  return { items: items.slice(start, start + size), page: current, totalPages, start }
}

/**
 * Sidnummer att visa: alltid den första, den sista och grannarna till den aktuella,
 * med '…' där några hoppas över. T.ex. (6, 12) → [1, '…', 5, 6, 7, '…', 12]
 */
export function pageWindow(current: number, total: number): (number | '…')[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  return pages.flatMap((p, i) => {
    const gap = p - (pages[i - 1] ?? p)
    // Om bara ett nummer saknas visas det i stället för '…'
    if (gap === 2) return [p - 1, p]
    return gap > 2 ? ['…' as const, p] : [p]
  })
}
