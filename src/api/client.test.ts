import { describe, expect, it } from 'vitest'
import { json, mockFetch, sentBody } from '../test/fetch'
import { ApiError, getErrorMessage, request } from './client'

describe('request', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    const fetchMock = mockFetch(() => json([{ id: 1 }]))

    await expect(request('GET', '/books')).resolves.toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/books', expect.objectContaining({ method: 'GET' }))
  })

  it('envía el cuerpo como JSON solo cuando lo hay', async () => {
    const fetchMock = mockFetch(() => json({}))

    await request('POST', '/loans', { memberId: 1, bookId: 2 })
    await request('GET', '/loans')

    const [, post] = fetchMock.mock.calls[0]
    expect(post?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(sentBody(fetchMock)).toEqual({ memberId: 1, bookId: 2 })
    const [, get] = fetchMock.mock.calls[1]
    expect(get?.headers).toBeUndefined()
    expect(get?.body).toBeUndefined()
  })

  it('lanza ApiError con el mensaje del backend', async () => {
    mockFetch(() => json({ status: 409, message: 'No quedan ejemplares disponibles.' }, 409))

    const error = await request('POST', '/loans', {}).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'No quedan ejemplares disponibles.' })
  })

  it('trata un 502 sin cuerpo (proxy sin backend) como servidor no disponible', async () => {
    mockFetch(() => new Response(null, { status: 502 }))

    await expect(request('GET', '/books')).rejects.toMatchObject({
      status: 0,
      message: 'No se pudo conectar con el servidor',
    })
  })

  it('usa un mensaje genérico si un error no trae cuerpo', async () => {
    mockFetch(() => new Response(null, { status: 404 }))

    await expect(request('GET', '/books/1')).rejects.toMatchObject({ status: 404, message: 'Error 404' })
  })

  it('convierte un fallo de red en ApiError con status 0', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    await expect(request('GET', '/books')).rejects.toMatchObject({
      status: 0,
      message: 'No se pudo conectar con el servidor',
    })
  })
})

describe('getErrorMessage', () => {
  it('devuelve el mensaje de un ApiError y uno genérico para lo demás', () => {
    expect(getErrorMessage(new ApiError(404, 'Libro no encontrado.'))).toBe('Libro no encontrado.')
    expect(getErrorMessage(new Error('detalle interno'))).toBe('Error inesperado')
    expect(getErrorMessage('cualquier cosa')).toBe('Error inesperado')
  })
})
