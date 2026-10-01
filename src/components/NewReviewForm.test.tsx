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
  it('rol Socio sin identificar: no muestra el formulario', () => {
    mockFetch(() => json([]))
    renderWithSession(<NewReviewForm bookId={5} onCreated={vi.fn()} />, 'user', null)

    expect(screen.getByText(/Elige quién eres/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publicar reseña' })).not.toBeInTheDocument()
  })

  it('rol Socio: reseña como el socio de la sesión, sin selector', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json({ id: 1 }, 201))
    const onCreated = vi.fn()
    renderWithSession(<NewReviewForm bookId={5} onCreated={onCreated} />, 'user', 7)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4 estrellas' }))
    await user.type(screen.getByPlaceholderText('¿Qué te ha parecido?'), 'Muy bueno')
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }))

    expect(await screen.findByText(/Reseña publicada/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/books/5/reviews', expect.objectContaining({ method: 'POST' }))
    expect(sentBody(fetchMock)).toEqual({ memberId: 7, rating: 4, comment: 'Muy bueno' })
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('no envía nada si falta la puntuación', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(() => json({}))
    renderWithSession(<NewReviewForm bookId={5} onCreated={vi.fn()} />, 'user', 7)

    await user.type(screen.getByPlaceholderText('¿Qué te ha parecido?'), 'Sin estrellas')
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }))

    expect(screen.getByText('Elige una puntuación de 1 a 5 estrellas')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('personal: elige el socio y muestra el error del backend', async () => {
    const user = userEvent.setup()
    mockFetch((_url, init) =>
      init?.method === 'POST'
        ? json({ status: 409, message: 'Este socio ya ha reseñado este libro.' }, 409)
        : json(members),
    )
    const onCreated = vi.fn()
    renderWithSession(<NewReviewForm bookId={5} onCreated={onCreated} />, 'librarian')

    await user.selectOptions(await screen.findByRole('combobox'), await screen.findByRole('option', { name: 'Harper Thomas' }))
    await user.click(screen.getByRole('button', { name: '5 estrellas' }))
    await user.type(screen.getByPlaceholderText('¿Qué te ha parecido?'), 'Otra vez')
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }))

    expect(await screen.findByText('Este socio ya ha reseñado este libro.')).toBeInTheDocument()
    expect(screen.queryByText(/Reseña publicada/)).not.toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('anuncia errores y confirmaciones, y vacía el aviso al reenviar', async () => {
    const user = userEvent.setup()
    let respond: (r: Response) => void = () => {}
    mockFetch(() => new Promise<Response>((resolve) => (respond = resolve)))
    renderWithSession(<NewReviewForm bookId={5} onCreated={vi.fn()} />, 'user', 7)

    // Sin estrellas: error en la región role="alert"
    await user.type(screen.getByPlaceholderText('¿Qué te ha parecido?'), 'Hola')
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Elige una puntuación de 1 a 5 estrellas')

    // Al reenviar, el aviso se vacía mientras se espera al backend
    await user.click(screen.getByRole('button', { name: '3 estrellas' }))
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()

    // Error del backend
    respond(json({ status: 409, message: 'El socio debe haber devuelto este libro antes de reseñarlo.' }, 409))
    expect(await screen.findByText(/debe haber devuelto/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('El socio debe haber devuelto este libro antes de reseñarlo.')

    // Segundo intento correcto: confirmación en role="status" y el error desaparece
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    respond(json({ id: 1 }, 201))
    expect(await screen.findByRole('status')).toHaveTextContent(/Reseña publicada/)
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })
})

