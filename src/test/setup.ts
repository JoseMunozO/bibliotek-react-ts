import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no implementa matchMedia: por defecto el sistema está en modo claro.
// Con defineProperty (y no vi.stubGlobal) se mantiene entre tests; para simular
// el modo oscuro del sistema, vi.spyOn(window, 'matchMedia') en el test.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
})

// Sin `globals: true` Testing Library no limpia el DOM sola entre tests
afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})
