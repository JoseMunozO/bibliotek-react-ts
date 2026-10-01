import type { ApiErrorBody } from './types'

// En desarrollo, el proxy de Vite redirige /api a http://localhost:8090
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Error de la API. `message` se puede mostrar directamente al usuario. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Mensaje listo para mostrar a partir de cualquier error capturado */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Error inesperado'
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
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(response.status, error?.message ?? `Error ${response.status}`)
  }

  return (await response.json()) as T
}

export const get = <T>(path: string) => request<T>('GET', path)
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
export const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body)
