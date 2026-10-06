import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { json, mockFetch, sentBody } from '../test/fetch'
import { renderWithSession } from '../test/render'
import NewReviewForm from './NewReviewForm'

const members = [
  { id: 1, fullName: 'Emma Hill' },
  { id: 2, fullName: 'Harper Thomas' },
]

describe('NewReviewForm', () => {
  it('rollen Medlem utan vald medlem: visar inte formuläret', () => {
    mockFetch(() => json([]))
    renderWithSession(<NewReviewForm bookId={5} onCreated={vi.fn()} />, 'user', null)

    expect(screen.getByText(/Välj vem du är/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publicera recension' })).not.toBeInTheDocument()
  })

  it('rollen Medlem: recenserar som sessionens medlem, utan väljare', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json({ id: 1 }, 201))
    const onCreated = vi.fn()
    renderWithSession(<NewReviewForm bookId={5} onCreated={onCreated} />, 'user', 7)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4 stjärnor' }))
    await user.type(screen.getByPlaceholderText('Vad tyckte du?'), 'Mycket bra')
    await user.click(screen.getByRole('button', { name: 'Publicera recension' }))

    expect(await screen.findByText(/Recensionen har publicerats/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/books/5/reviews', expect.objectContaining({ method: 'POST' }))
    expect(sentBody(fetchMock)).toEqual({ memberId: 7, rating: 4, comment: 'Mycket bra' })
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('skickar inget om betyg saknas', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json({}))
    renderWithSession(<NewReviewForm bookId={5} onCreated={vi.fn()} />, 'user', 7)

    await user.type(screen.getByPlaceholderText('Vad tyckte du?'), 'Utan stjärnor')
    await user.click(screen.getByRole('button', { name: 'Publicera recension' }))

    expect(screen.getByText('Välj ett betyg från 1 till 5 stjärnor')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('personal: väljer medlem och visar felet från backend', async () => {
    const user = userEvent.setup()
    mockFetch((_url, init) =>
      init?.method === 'POST'
        ? json({ status: 409, message: 'Medlemmen har redan recenserat den här boken.' }, 409)
        : json(members),
    )
    const onCreated = vi.fn()
    renderWithSession(<NewReviewForm bookId={5} onCreated={onCreated} />, 'librarian')

    await user.selectOptions(await screen.findByRole('combobox'), await screen.findByRole('option', { name: 'Harper Thomas' }))
    await user.click(screen.getByRole('button', { name: '5 stjärnor' }))
    await user.type(screen.getByPlaceholderText('Vad tyckte du?'), 'En gång till')
    await user.click(screen.getByRole('button', { name: 'Publicera recension' }))

    expect(await screen.findByText('Medlemmen har redan recenserat den här boken.')).toBeInTheDocument()
    expect(screen.queryByText(/Recensionen har publicerats/)).not.toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('läser upp fel och bekräftelser, och tömmer meddelandet vid nytt försök', async () => {
    const user = userEvent.setup()
    let respond: (r: Response) => void = () => {}
    mockFetch(() => new Promise<Response>((resolve) => (respond = resolve)))
    renderWithSession(<NewReviewForm bookId={5} onCreated={vi.fn()} />, 'user', 7)

    // Utan stjärnor: fel i regionen role="alert"
    await user.type(screen.getByPlaceholderText('Vad tyckte du?'), 'Hej')
    await user.click(screen.getByRole('button', { name: 'Publicera recension' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Välj ett betyg från 1 till 5 stjärnor')

    // Vid nytt försök töms meddelandet medan backend svarar
    await user.click(screen.getByRole('button', { name: '3 stjärnor' }))
    await user.click(screen.getByRole('button', { name: 'Publicera recension' }))
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()

    // Fel från backend
    respond(json({ status: 409, message: 'Medlemmen måste ha lämnat tillbaka boken innan den kan recenseras.' }, 409))
    expect(await screen.findByText(/måste ha lämnat tillbaka/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Medlemmen måste ha lämnat tillbaka boken innan den kan recenseras.')

    // Andra försöket lyckas: bekräftelse i role="status" och felet försvinner
    await user.click(screen.getByRole('button', { name: 'Publicera recension' }))
    respond(json({ id: 1 }, 201))
    expect(await screen.findByRole('status')).toHaveTextContent(/Recensionen har publicerats/)
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })
})

