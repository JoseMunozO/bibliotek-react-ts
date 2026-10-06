import { describe, expect, it } from 'vitest'
import { json, mockFetch, sentBody } from '../test/fetch'
import { ApiError, getErrorMessage, request } from './client'

describe('request', () => {
  it('returnerar JSON från ett lyckat svar', async () => {
    const fetchMock = mockFetch(() => json([{ id: 1 }]))

    await expect(request('GET', '/books')).resolves.toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/books', expect.objectContaining({ method: 'GET' }))
  })

  it('skickar kroppen som JSON bara när det finns en', async () => {
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

  it('kastar ApiError med meddelandet från backend', async () => {
    mockFetch(() => json({ status: 409, message: 'Det finns inga lediga exemplar kvar.' }, 409))

    const error = await request('POST', '/loans', {}).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'Det finns inga lediga exemplar kvar.' })
  })

  it('behandlar 502 utan kropp (proxy utan backend) som att servern inte är tillgänglig', async () => {
    mockFetch(() => new Response(null, { status: 502 }))

    await expect(request('GET', '/books')).rejects.toMatchObject({
      status: 0,
      message: 'Kunde inte ansluta till servern',
    })
  })

  it('använder ett generellt meddelande om ett fel saknar kropp', async () => {
    mockFetch(() => new Response(null, { status: 404 }))

    await expect(request('GET', '/books/1')).rejects.toMatchObject({ status: 404, message: 'Fel 404' })
  })

  it('gör om ett nätverksfel till ApiError med status 0', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    await expect(request('GET', '/books')).rejects.toMatchObject({
      status: 0,
      message: 'Kunde inte ansluta till servern',
    })
  })
})

describe('getErrorMessage', () => {
  it('returnerar meddelandet från en ApiError och ett generellt för allt annat', () => {
    expect(getErrorMessage(new ApiError(404, 'Boken hittades inte.'))).toBe('Boken hittades inte.')
    expect(getErrorMessage(new Error('intern detalj'))).toBe('Oväntat fel')
    expect(getErrorMessage('vad som helst')).toBe('Oväntat fel')
  })
})
