import { vi } from 'vitest'

/** Respuesta JSON como la del backend */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>

/** Sustituye `fetch` por `handler` (se restaura solo tras cada test: `unstubGlobals`) */
export function mockFetch(handler: Handler) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(handler(String(input), init)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Cuerpo JSON enviado en la llamada `n` del mock */
export function sentBody(fetchMock: ReturnType<typeof mockFetch>, n = 0): unknown {
  const body = fetchMock.mock.calls[n]?.[1]?.body
  return typeof body === 'string' ? JSON.parse(body) : undefined
}
