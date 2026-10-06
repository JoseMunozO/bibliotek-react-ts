import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { json, mockFetch } from '../test/fetch'
import { renderApp } from '../test/render'

const book = (id: number, title: string, authors = 'Autor', availableCopies = 1) => ({ id, title, authors, availableCopies })

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
  it('lista los libros y enlaza a su detalle', async () => {
    mockFetch(() => json([book(1, 'Wild Ice of Dreams')]))
    renderApp('/bocker')

    const link = await screen.findByRole('link', { name: /Wild Ice of Dreams/ })
    expect(link).toHaveAttribute('href', '/bocker/1')
  })

  it('guarda la búsqueda en la URL y la recupera al cargar', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json([]))
    renderApp('/bocker?q=ice')

    const input = screen.getByPlaceholderText('Buscar por título o autor...')
    expect(input).toHaveValue('ice')
    await user.type(input, 's')

    expect(screen.getByTestId('location')).toHaveTextContent('/bocker?q=ices')
    expect(fetchMock).toHaveBeenLastCalledWith('/api/books?search=ices', expect.anything())
  })

  it('ignora la respuesta de una búsqueda anterior que llega tarde', async () => {
    const user = userEvent.setup()
    let resolveSlow: (r: Response) => void = () => {}
    mockFetch((url) =>
      url.endsWith('search=a')
        ? new Promise<Response>((resolve) => (resolveSlow = resolve)) // la primera tarda
        : json([book(2, 'Resultado de ab')]),
    )
    renderApp('/bocker')

    const input = screen.getByPlaceholderText('Buscar por título o autor...')
    await user.type(input, 'a')
    await user.type(input, 'b')
    expect(await screen.findByText('Resultado de ab')).toBeInTheDocument()

    // Llega ahora la respuesta de "a": no debe sustituir a la de "ab"
    resolveSlow(json([book(1, 'Resultado obsoleto de a')]))
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByText('Resultado obsoleto de a')).not.toBeInTheDocument()
    expect(screen.getByText('Resultado de ab')).toBeInTheDocument()
  })

  it('ordena por título por defecto y por autor o disponibilidad al elegirlo', async () => {
    const user = userEvent.setup()
    mockFetch(() => json(catalog))
    renderApp('/bocker')

    await screen.findByText('3 libros')
    expect(titles()).toEqual(['Ancient Fire', 'Broken City', 'Cursed Key'])

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'forfattare')
    expect(titles()).toEqual(['Broken City', 'Cursed Key', 'Ancient Fire'])
    expect(screen.getByTestId('location')).toHaveTextContent('/bocker?sortering=forfattare')

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'tillgangliga')
    expect(titles()).toEqual(['Ancient Fire', 'Broken City', 'Cursed Key'])
  })

  it('combina búsqueda, filtro y orden, y los conserva en la URL', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json(catalog))
    renderApp('/bocker?q=c&sortering=forfattare')

    await screen.findByText('3 libros')
    await user.click(screen.getByLabelText('Solo disponibles'))

    expect(titles()).toEqual(['Broken City', 'Ancient Fire'])
    expect(screen.getByText('2 de 3 libros')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/bocker?q=c&sortering=forfattare&tillgangliga=1')
    // El filtro y el orden no generan peticiones nuevas: solo la búsqueda va al servidor
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/books?search=c'])
  })

  it('lee el filtro de la URL e ignora un orden no válido', async () => {
    mockFetch(() => json(catalog))
    renderApp('/bocker?tillgangliga=1&sortering=pris')

    await screen.findByText('2 de 3 libros')
    expect(screen.getByLabelText('Solo disponibles')).toBeChecked()
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('titel')
    expect(titles()).toEqual(['Ancient Fire', 'Broken City'])
  })

  it('explica por qué la lista está vacía', async () => {
    const user = userEvent.setup()
    mockFetch(() => json([book(1, 'Cursed Key', 'Mason Campbell', 0)]))
    renderApp('/bocker')

    await user.click(await screen.findByLabelText('Solo disponibles'))
    expect(screen.getByText('Ninguno de estos libros tiene ejemplares disponibles.')).toBeInTheDocument()
  })

  describe('paginación', () => {
    // 45 libros "Libro 01"…"Libro 45": 3 páginas de 20 ordenadas por título
    const many = Array.from({ length: 45 }, (_, i) =>
      book(i + 1, `Libro ${String(i + 1).padStart(2, '0')}`, 'Autor', i % 2),
    )
    const page = () => screen.getByRole('button', { current: 'page' }).textContent

    it('muestra 20 libros por página y navega con la URL', async () => {
      const user = userEvent.setup()
      mockFetch(() => json(many))
      renderApp('/bocker')

      expect(await screen.findByText('1–20 · 45 libros')).toBeInTheDocument()
      expect(titles()).toHaveLength(20)
      expect(titles()[0]).toBe('Libro 01')
      expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/bocker?sida=2')
      expect(titles()[0]).toBe('Libro 21')
      expect(page()).toBe('2')

      await user.click(screen.getByRole('button', { name: 'Página 3' }))
      expect(screen.getByText('41–45 · 45 libros')).toBeInTheDocument()
      expect(titles()).toHaveLength(5)
      expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
    })

    it('vuelve a la primera página al cambiar filtro u orden', async () => {
      const user = userEvent.setup()
      mockFetch(() => json(many))
      renderApp('/bocker?sida=3')

      await screen.findByText('41–45 · 45 libros')
      await user.click(screen.getByLabelText('Solo disponibles'))

      // 22 disponibles (los pares): 2 páginas, y se vuelve a la 1
      expect(screen.getByText('1–20 · 22 de 45 libros')).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/bocker?tillgangliga=1')
      expect(page()).toBe('1')
    })

    it('ajusta una página fuera de rango y oculta la paginación si sobra', async () => {
      mockFetch(() => json(many))
      const { unmount } = renderApp('/bocker?sida=99')
      expect(await screen.findByText('41–45 · 45 libros')).toBeInTheDocument()
      unmount()

      mockFetch(() => json(many.slice(0, 5)))
      renderApp('/bocker')
      await screen.findByText('5 libros')
      expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
    })
  })
})

