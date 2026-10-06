import { QueryClient, type DefaultOptions } from '@tanstack/react-query'
import { ApiError } from './api'

/** 4xx (t.ex. 404 eller 409) blir inte bättre av ett nytt försök; nätverksfel och 5xx får två till */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

export function createQueryClient(overrides: DefaultOptions['queries'] = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, ...overrides },
    },
  })
}
