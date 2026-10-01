import { describe, expect, it } from 'vitest'
import { json, mockFetch, sentBody } from '../test/fetch'
import { booksApi, loansApi, membersApi, notificationsApi } from '.'

const urlOf = (fetchMock: ReturnType<typeof mockFetch>, n = 0) => fetchMock.mock.calls[n][0]
const methodOf = (fetchMock: ReturnType<typeof mockFetch>, n = 0) => fetchMock.mock.calls[n][1]?.method

describe('booksApi.list', () => {
  it.each([
    [undefined, '/api/books'],
    [{ search: 'el señor' }, '/api/books?search=el+se%C3%B1or'],
    [{ available: true as const }, '/api/books?available=true'],
    [{ sort: 'author' as const }, '/api/books?sort=author'],
  ])('%o → %s', async (query, url) => {
    const fetchMock = mockFetch(() => json([]))
    await booksApi.list(query)
    expect(urlOf(fetchMock)).toBe(url)
  })
})

describe('endpoints', () => {
  it('construye las URLs y métodos esperados', async () => {
    const fetchMock = mockFetch(() => json({}))

    await booksApi.mostBorrowed()
    await booksApi.addReview(5, { memberId: 7, rating: 4, comment: 'Bien' })
    await membersApi.payFine(3, 38)
    await membersApi.update(3, { firstName: 'Ana', lastName: 'López', email: 'a@b.se', membershipType: 'premium' })
    await loansApi.return(9)
    await notificationsApi.markAsRead(91)

    expect(fetchMock.mock.calls.map((_, n) => `${methodOf(fetchMock, n)} ${urlOf(fetchMock, n)}`)).toEqual([
      'GET /api/books/most-borrowed?limit=10',
      'POST /api/books/5/reviews',
      'POST /api/members/3/fines/38/pay',
      'PUT /api/members/3',
      'POST /api/loans/9/return',
      'POST /api/notifications/91/read',
    ])
  })

  it('envía los cuerpos con los campos que espera el backend', async () => {
    const fetchMock = mockFetch(() => json({}))

    await loansApi.extend(9, 7)
    await notificationsApi.create({ memberId: 52, type: 'loan_reminder', message: 'Hola', loanId: undefined })

    expect(sentBody(fetchMock, 0)).toEqual({ extraDays: 7 })
    // loanId opcional: si no hay préstamo no se envía
    expect(sentBody(fetchMock, 1)).toEqual({ memberId: 52, type: 'loan_reminder', message: 'Hola' })
  })
})
