import { vi } from 'vitest'

/** JSON-svar som från backend */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>

/** Ersätter `fetch` med `handler` (återställs automatiskt efter varje test: `unstubGlobals`) */
export function mockFetch(handler: Handler) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(handler(String(input), init)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** JSON-kropp som skickades i anrop `n` till mocken */
export function sentBody(fetchMock: ReturnType<typeof mockFetch>, n = 0): unknown {
  const body = fetchMock.mock.calls[n]?.[1]?.body
  return typeof body === 'string' ? JSON.parse(body) : undefined
}
