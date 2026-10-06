import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { json, mockFetch } from '../test/fetch'
import { renderApp } from '../test/render'

const book = (id: number, title: string, authors = 'Författare', availableCopies = 1) => ({ id, title, authors, availableCopies })

const catalog = [
  book(1, 'Cursed Key', 'Mason Campbell', 0),
  book(2, 'Ancient Fire', 'Oliver Scott', 2),
  book(3, 'Broken City', 'Ava Miller', 1),
]

const titles = () =>
  screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('/bocker/'))
    .map((a) => a.querySelector('p')?.textContent)

describe('BooksPage', () => {
  it('listar böckerna och länkar till deras detaljsida', async () => {
    mockFetch(() => json([book(1, 'Wild Ice of Dreams')]))
    renderApp('/bocker')

    const link = await screen.findByRole('link', { name: /Wild Ice of Dreams/ })
    expect(link).toHaveAttribute('href', '/bocker/1')
  })

  it('sparar sökningen i URL:en och läser in den vid start', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json([]))
    renderApp('/bocker?q=ice')

    const input = screen.getByPlaceholderText('Sök på titel eller författare …')
    expect(input).toHaveValue('ice')
    await user.type(input, 's')

    expect(screen.getByTestId('location')).toHaveTextContent('/bocker?q=ices')
    expect(fetchMock).toHaveBeenLastCalledWith('/api/books?search=ices', expect.anything())
  })

  it('ignorerar svaret från en tidigare sökning som kommer för sent', async () => {
    const user = userEvent.setup()
    let resolveSlow: (r: Response) => void = () => {}
    mockFetch((url) =>
      url.endsWith('search=a')
        ? new Promise<Response>((resolve) => (resolveSlow = resolve)) // den första dröjer
        : json([book(2, 'Resultat för ab')]),
    )
    renderApp('/bocker')

    const input = screen.getByPlaceholderText('Sök på titel eller författare …')
    await user.type(input, 'a')
    await user.type(input, 'b')
    expect(await screen.findByText('Resultat för ab')).toBeInTheDocument()

    // Nu kommer svaret för "a": det får inte ersätta svaret för "ab"
    resolveSlow(json([book(1, 'Inaktuellt resultat för a')]))
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByText('Inaktuellt resultat för a')).not.toBeInTheDocument()
    expect(screen.getByText('Resultat för ab')).toBeInTheDocument()
  })

  it('sorterar på titel som standard och på författare eller tillgänglighet när det väljs', async () => {
    const user = userEvent.setup()
    mockFetch(() => json(catalog))
    renderApp('/bocker')

    await screen.findByText('3 böcker')
    expect(titles()).toEqual(['Ancient Fire', 'Broken City', 'Cursed Key'])

    await user.selectOptions(screen.getByLabelText('Sortera efter'), 'forfattare')
    expect(titles()).toEqual(['Broken City', 'Cursed Key', 'Ancient Fire'])
    expect(screen.getByTestId('location')).toHaveTextContent('/bocker?sortering=forfattare')

    await user.selectOptions(screen.getByLabelText('Sortera efter'), 'tillgangliga')
    expect(titles()).toEqual(['Ancient Fire', 'Broken City', 'Cursed Key'])
  })

  it('kombinerar sökning, filter och sortering, och behåller dem i URL:en', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json(catalog))
    renderApp('/bocker?q=c&sortering=forfattare')

    await screen.findByText('3 böcker')
    await user.click(screen.getByLabelText('Endast lediga'))

    expect(titles()).toEqual(['Broken City', 'Ancient Fire'])
    expect(screen.getByText('2 av 3 böcker')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/bocker?q=c&sortering=forfattare&tillgangliga=1')
    // Filtret och sorteringen ger inga nya anrop: bara sökningen går till servern
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/books?search=c'])
  })

  it('läser filtret från URL:en och ignorerar en ogiltig sortering', async () => {
    mockFetch(() => json(catalog))
    renderApp('/bocker?tillgangliga=1&sortering=pris')

    await screen.findByText('2 av 3 böcker')
    expect(screen.getByLabelText('Endast lediga')).toBeChecked()
    expect(screen.getByLabelText('Sortera efter')).toHaveValue('titel')
    expect(titles()).toEqual(['Ancient Fire', 'Broken City'])
  })

  it('förklarar varför listan är tom', async () => {
    const user = userEvent.setup()
    mockFetch(() => json([book(1, 'Cursed Key', 'Mason Campbell', 0)]))
    renderApp('/bocker')

    await user.click(await screen.findByLabelText('Endast lediga'))
    expect(screen.getByText('Ingen av de här böckerna har lediga exemplar.')).toBeInTheDocument()
  })

  describe('sidindelning', () => {
    // 45 böcker "Bok 01"…"Bok 45": 3 sidor om 20, sorterade på titel
    const many = Array.from({ length: 45 }, (_, i) =>
      book(i + 1, `Bok ${String(i + 1).padStart(2, '0')}`, 'Författare', i % 2),
    )
    const page = () => screen.getByRole('button', { current: 'page' }).textContent

    it('visar 20 böcker per sida och navigerar via URL:en', async () => {
      const user = userEvent.setup()
      mockFetch(() => json(many))
      renderApp('/bocker')

      expect(await screen.findByText('1–20 · 45 böcker')).toBeInTheDocument()
      expect(titles()).toHaveLength(20)
      expect(titles()[0]).toBe('Bok 01')
      expect(screen.getByRole('button', { name: 'Föregående sida' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Nästa sida' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/bocker?sida=2')
      expect(titles()[0]).toBe('Bok 21')
      expect(page()).toBe('2')

      await user.click(screen.getByRole('button', { name: 'Sida 3' }))
      expect(screen.getByText('41–45 · 45 böcker')).toBeInTheDocument()
      expect(titles()).toHaveLength(5)
      expect(screen.getByRole('button', { name: 'Nästa sida' })).toBeDisabled()
    })

    it('går tillbaka till första sidan när filter eller sortering ändras', async () => {
      const user = userEvent.setup()
      mockFetch(() => json(many))
      renderApp('/bocker?sida=3')

      await screen.findByText('41–45 · 45 böcker')
      await user.click(screen.getByLabelText('Endast lediga'))

      // 22 lediga (de jämna): 2 sidor, och man hamnar på sida 1
      expect(screen.getByText('1–20 · 22 av 45 böcker')).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/bocker?tillgangliga=1')
      expect(page()).toBe('1')
    })

    it('justerar en sida utanför intervallet och döljer sidnavigeringen när den inte behövs', async () => {
      mockFetch(() => json(many))
      const { unmount } = renderApp('/bocker?sida=99')
      expect(await screen.findByText('41–45 · 45 böcker')).toBeInTheDocument()
      unmount()

      mockFetch(() => json(many.slice(0, 5)))
      renderApp('/bocker')
      await screen.findByText('5 böcker')
      expect(screen.queryByRole('navigation', { name: 'Sidnavigering' })).not.toBeInTheDocument()
    })
  })
})

