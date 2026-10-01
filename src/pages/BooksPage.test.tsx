import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { json, mockFetch } from '../test/fetch'
import { renderApp } from '../test/render'

const book = (id: number, title: string) => ({ id, title, authors: 'Autor', availableCopies: 1 })

describe('BooksPage', () => {
  it('lista los libros y enlaza a su detalle', async () => {
    mockFetch(() => json([book(1, 'Wild Ice of Dreams')]))
    renderApp('/libros')

    const link = await screen.findByRole('link', { name: /Wild Ice of Dreams/ })
    expect(link).toHaveAttribute('href', '/libros/1')
  })

  it('guarda la búsqueda en la URL y la recupera al cargar', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json([]))
    renderApp('/libros?q=ice')

    const input = screen.getByPlaceholderText('Buscar por título o autor...')
    expect(input).toHaveValue('ice')
    await user.type(input, 's')

    expect(screen.getByTestId('location')).toHaveTextContent('/libros?q=ices')
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
    renderApp('/libros')

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
})
