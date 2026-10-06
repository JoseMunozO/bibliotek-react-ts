import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { json, mockFetch, sentBody } from '../test/fetch'
import { renderApp } from '../test/render'

// Fasta datum långt från i dag så att testerna inte beror på vilken dag de körs
const onTime = {
  id: 1,
  bookId: 54,
  bookTitle: 'Ancient Fire Reborn',
  memberId: 52,
  memberName: 'Test Testsson',
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
      return json([{ loanId: 2, bookId: 54, bookTitle: overdue.bookTitle, memberId: 52, memberName: 'Test Testsson', memberEmail: 'p@example.test', dueDate: overdue.dueDate }])
    return json([])
  })
})

const row = async (title: string) => (await screen.findByText(title, { selector: 'li p' })).closest('li')!

describe('LoansPage', () => {
  it('markerar försenade lån och låter bara förlänga dem som inte är försenade', async () => {
    renderApp('/lan', { role: 'librarian' })

    const late = within(await row('Wild Ice of Dreams'))
    expect(late.getByText('Försenad 2020-01-15')).toBeInTheDocument()
    expect(late.queryByRole('button', { name: 'Förläng' })).not.toBeInTheDocument()

    const ok = within(await row('Ancient Fire Reborn'))
    expect(ok.getByText('Förfaller 2099-01-08')).toBeInTheDocument()
    expect(ok.getByRole('button', { name: 'Förläng' })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Försenade (1)' })).toBeInTheDocument()
  })

  it('förlänger med angivet antal dagar', async () => {
    const user = userEvent.setup()
    renderApp('/lan', { role: 'librarian' })

    const ok = within(await row('Ancient Fire Reborn'))
    await user.clear(ok.getByLabelText('Dagar att förlänga'))
    await user.type(ok.getByLabelText('Dagar att förlänga'), '7')
    await user.click(ok.getByRole('button', { name: 'Förläng' }))

    expect(await screen.findByText('"Ancient Fire Reborn" förlängd till 2099-01-15.')).toBeInTheDocument()
    const call = fetchMock.mock.calls.findIndex(([url]) => url === '/api/loans/1/extend')
    expect(sentBody(fetchMock, call)).toEqual({ extraDays: 7 })
  })

  it('visar böterna när en bok lämnas tillbaka för sent', async () => {
    const user = userEvent.setup()
    renderApp('/lan', { role: 'librarian' })

    await user.click(within(await row('Wild Ice of Dreams')).getByRole('button', { name: 'Återlämna' }))

    expect(await screen.findByText('"Wild Ice of Dreams" återlämnad för sent. Böter: 4.00')).toBeInTheDocument()
  })

  it('laddar om lånen och formulärets lediga böcker efter en återlämning', async () => {
    const user = userEvent.setup()
    renderApp('/lan', { role: 'librarian' })
    await user.click(within(await row('Wild Ice of Dreams')).getByRole('button', { name: 'Återlämna' }))
    await screen.findByText(/återlämnad för sent/)

    const urls = fetchMock.mock.calls.map(([url]) => url)
    const afterReturn = urls.slice(urls.indexOf('/api/loans/2/return') + 1)
    expect(afterReturn).toEqual(
      expect.arrayContaining(['/api/loans', '/api/loans/overdue', '/api/books?available=true', '/api/members']),
    )
  })
})
