import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseId } from './navigation'
import { permissionsFor } from './session'
import { formatAmount, notificationTypeLabel, sortBooks, today } from './utils'

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

describe('sortBooks', () => {
  const books = [
    { id: 1, title: 'Libro 10', authors: 'Zoe Ávila', availableCopies: 0 },
    { id: 2, title: 'él y yo', authors: 'Ana Pérez', availableCopies: 2 },
    { id: 3, title: 'Libro 2', authors: 'ana pérez', availableCopies: 2 },
    { id: 4, title: 'Árbol', authors: 'Bruno Díaz', availableCopies: 5 },
  ]
  const ids = (list: typeof books) => list.map((b) => b.id)

  it('por título ignora tildes y mayúsculas y ordena los números de forma natural', () => {
    expect(ids(sortBooks(books, 'titulo'))).toEqual([4, 2, 3, 1])
  })

  it('por autor, y a igualdad de autor por título', () => {
    expect(ids(sortBooks(books, 'autor'))).toEqual([2, 3, 4, 1])
  })

  it('por ejemplares disponibles de más a menos, y a igualdad por título', () => {
    expect(ids(sortBooks(books, 'disponibles'))).toEqual([4, 2, 3, 1])
  })

  it('no modifica la lista original', () => {
    const copy = [...books]
    sortBooks(books, 'autor')
    expect(books).toEqual(copy)
  })
})
