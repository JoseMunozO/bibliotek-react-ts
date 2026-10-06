import type { ApiErrorBody } from './types'

// Under utveckling skickar Vites proxy /api vidare till http://localhost:8090
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Fel från API:t. `message` kan visas direkt för användaren. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Meddelande som kan visas direkt, utifrån vilket fångat fel som helst */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Oväntat fel'
}

type Method ='GET' | 'POST' | 'PUT'

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Kunde inte ansluta till servern')
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorBody | null
    if (error?.message) throw new ApiError(response.status, error.message)
    // 502/503/504 utan JSON-kropp: Vites proxy når inte backend (den är stoppad)
    if (response.status >= 502 && response.status <= 504)
      throw new ApiError(0, 'Kunde inte ansluta till servern')
    throw new ApiError(response.status, `Fel ${response.status}`)
  }

  return (await response.json()) as T
}

export const get = <T>(path: string) => request<T>('GET', path)
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
export const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body)
