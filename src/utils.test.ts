import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseId } from './navigation'
import { permissionsFor } from './session'
import { formatAmount, notificationTypeLabel, today } from './utils'

describe('today', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve la fecha local como YYYY-MM-DD, comparable con las de la API', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30)) // 5 de enero, hora local
    expect(today()).toBe('2026-01-05')
    expect('2026-01-04' < today()).toBe(true)
  })
})

describe('formatAmount', () => {
  it('muestra siempre dos decimales', () => {
    expect(formatAmount(0)).toBe('0.00')
    expect(formatAmount(14)).toBe('14.00')
    expect(formatAmount(2.5)).toBe('2.50')
  })
})

describe('notificationTypeLabel', () => {
  it('traduce los tipos conocidos', () => {
    expect(notificationTypeLabel('overdue_warning')).toBe('Aviso de retraso')
    expect(notificationTypeLabel('pending_fine')).toBe('Multa pendiente')
  })

  it('convierte en texto legible los tipos desconocidos', () => {
    expect(notificationTypeLabel('book_available')).toBe('Book available')
  })
})

describe('parseId', () => {
  it.each([
    ['3', 3],
    ['42', 42],
    ['0', null],
    ['-1', null],
    ['2.5', null],
    ['abc', null],
    ['', null],
    [undefined, null],
    [null, null],
  ])('%o → %o', (value, expected) => {
    expect(parseId(value)).toBe(expected)
  })
})

describe('permissionsFor', () => {
  it('reparte los permisos como el menú de consola', () => {
    expect(permissionsFor('user')).toEqual({
      viewMembers: false,
      manageMembers: false,
      manageLoans: false,
      payFines: false,
      manageNotifications: false,
      reviewAsAnyMember: false,
      changeMembershipType: false,
    })
    expect(permissionsFor('librarian')).toEqual({
      viewMembers: true,
      manageMembers: false,
      manageLoans: true,
      payFines: true,
      manageNotifications: true,
      reviewAsAnyMember: true,
      changeMembershipType: false,
    })
    expect(Object.values(permissionsFor('admin')).every(Boolean)).toBe(true)
  })
})
