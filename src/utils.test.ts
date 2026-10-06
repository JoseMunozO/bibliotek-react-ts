import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseId } from './navigation'
import { permissionsFor } from './session'
import { formatAmount, notificationTypeLabel, pageWindow, paginate, sortBooks, today } from './utils'

describe('today', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returnerar lokalt datum som YYYY-MM-DD, jämförbart med API:ts', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30)) // 5 januari, lokal tid
    expect(today()).toBe('2026-01-05')
    expect('2026-01-04' < today()).toBe(true)
  })
})

describe('formatAmount', () => {
  it('visar alltid två decimaler', () => {
    expect(formatAmount(0)).toBe('0.00')
    expect(formatAmount(14)).toBe('14.00')
    expect(formatAmount(2.5)).toBe('2.50')
  })
})

describe('notificationTypeLabel', () => {
  it('översätter kända typer', () => {
    expect(notificationTypeLabel('overdue_warning')).toBe('Förseningsvarning')
    expect(notificationTypeLabel('pending_fine')).toBe('Obetalda böter')
  })

  it('gör om okända typer till läsbar text', () => {
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
  it('fördelar behörigheterna som konsolmenyn', () => {
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
    { id: 1, title: 'Bok 10', authors: 'Örjan Ek', availableCopies: 0 },
    { id: 2, title: 'bok 2', authors: 'Anna Berg', availableCopies: 2 },
    { id: 3, title: 'Älven', authors: 'anna berg', availableCopies: 2 },
    { id: 4, title: 'Zebran', authors: 'Bo Dahl', availableCopies: 5 },
  ]
  const ids = (list: typeof books) => list.map((b) => b.id)

  it('efter titel i svensk ordning, utan hänsyn till versaler och med naturlig sortering av siffror', () => {
    expect(ids(sortBooks(books, 'titel'))).toEqual([2, 1, 4, 3])
  })

  it('efter författare, och vid samma författare efter titel', () => {
    expect(ids(sortBooks(books, 'forfattare'))).toEqual([2, 3, 4, 1])
  })

  it('efter lediga exemplar i fallande ordning, och vid lika antal efter titel', () => {
    expect(ids(sortBooks(books, 'tillgangliga'))).toEqual([4, 2, 3, 1])
  })

  it('ändrar inte den ursprungliga listan', () => {
    const copy = [...books]
    sortBooks(books, 'forfattare')
    expect(books).toEqual(copy)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1)

  it('returnerar begärd sida och totalt antal sidor', () => {
    expect(paginate(items, 2, 20)).toEqual({ items: items.slice(20, 40), page: 2, totalPages: 3, start: 20 })
    expect(paginate(items, 3, 20).items).toEqual([41, 42, 43, 44, 45])
  })

  it('justerar sidor utanför intervallet eller ogiltiga sidor', () => {
    expect(paginate(items, 99, 20).page).toBe(3)
    expect(paginate(items, 0, 20).page).toBe(1)
    expect(paginate(items, NaN, 20).page).toBe(1)
    expect(paginate(items, 2.7, 20).page).toBe(2)
  })

  it('en tom lista har en tom sida', () => {
    expect(paginate([], 1, 20)).toEqual({ items: [], page: 1, totalPages: 1, start: 0 })
  })
})

describe('pageWindow', () => {
  it.each<[number, number, (number | '…')[]]>([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [1, 10, [1, 2, '…', 10]],
    [6, 12, [1, '…', 5, 6, 7, '…', 12]],
    [3, 10, [1, 2, 3, 4, '…', 10]], // mellan 1 och 2 hoppas inget över
    [4, 10, [1, 2, 3, 4, 5, '…', 10]], // bara 2 saknas: visas i stället för '…'
    [10, 10, [1, '…', 9, 10]],
  ])('sida %i av %i → %o', (current, total, expected) => {
    expect(pageWindow(current, total)).toEqual(expected)
  })
})
