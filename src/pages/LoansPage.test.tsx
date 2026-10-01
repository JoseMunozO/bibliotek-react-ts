import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { json, mockFetch, sentBody } from '../test/fetch'
import { renderApp } from '../test/render'

// Fechas fijas lejos de hoy para que los tests no dependan del día en que se ejecutan
const onTime = {
  id: 1,
  bookId: 54,
  bookTitle: 'Ancient Fire Reborn',
  memberId: 52,
  memberName: 'Prueba Claude',
  loanDate: '2098-12-25',
  dueDate: '2099-01-08',
  returnDate: null,
}
const overdue = { ...onTime, id: 2, bookTitle: 'Wild Ice of Dreams', loanDate: '2020-01-01', dueDate: '2020-01-15' }

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch((url, init) => {
    if (init?.method === 'POST' && url === '/api/loans/1/extend') return json({ ...onTime, dueDate: '2099-01-15' })
    if (init?.method === 'POST' && url === '/api/loans/2/return')
      return json({ loan: { ...overdue, returnDate: '2020-01-17' }, fineAmount: 4 })
    if (url === '/api/loans') return json([onTime, overdue])
    if (url === '/api/loans/overdue')
      return json([{ loanId: 2, bookId: 54, bookTitle: overdue.bookTitle, memberId: 52, memberName: 'Prueba Claude', memberEmail: 'p@example.test', dueDate: overdue.dueDate }])
    return json([])
  })
})

const row = async (title: string) => (await screen.findByText(title, { selector: 'li p' })).closest('li')!

describe('LoansPage', () => {
  it('marca los préstamos vencidos y solo deja prorrogar los que están a tiempo', async () => {
    renderApp('/prestamos', { role: 'librarian' })

    const late = within(await row('Wild Ice of Dreams'))
    expect(late.getByText('Vencido 2020-01-15')).toBeInTheDocument()
    expect(late.queryByRole('button', { name: 'Prorrogar' })).not.toBeInTheDocument()

    const ok = within(await row('Ancient Fire Reborn'))
    expect(ok.getByText('Vence 2099-01-08')).toBeInTheDocument()
    expect(ok.getByRole('button', { name: 'Prorrogar' })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Vencidos (1)' })).toBeInTheDocument()
  })

  it('prorroga los días indicados', async () => {
    const user = userEvent.setup()
    renderApp('/prestamos', { role: 'librarian' })

    const ok = within(await row('Ancient Fire Reborn'))
    await user.clear(ok.getByLabelText('Días de prórroga'))
    await user.type(ok.getByLabelText('Días de prórroga'), '7')
    await user.click(ok.getByRole('button', { name: 'Prorrogar' }))

    expect(await screen.findByText('"Ancient Fire Reborn" prorrogado hasta 2099-01-15.')).toBeInTheDocument()
    const call = fetchMock.mock.calls.findIndex(([url]) => url === '/api/loans/1/extend')
    expect(sentBody(fetchMock, call)).toEqual({ extraDays: 7 })
  })

  it('al devolver con retraso muestra la multa', async () => {
    const user = userEvent.setup()
    renderApp('/prestamos', { role: 'librarian' })

    await user.click(within(await row('Wild Ice of Dreams')).getByRole('button', { name: 'Devolver' }))

    expect(await screen.findByText('"Wild Ice of Dreams" devuelto con retraso. Multa: 4.00')).toBeInTheDocument()
  })
})
