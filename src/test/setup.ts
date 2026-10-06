import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom implementerar inte matchMedia: som standard är systemet i ljust läge.
// Med defineProperty (och inte vi.stubGlobal) finns den kvar mellan testerna; för att simulera
// systemets mörka läge, använd vi.spyOn(window, 'matchMedia') i testet.
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

// jsdom implementerar inte heller scrollTo (sidindelningen skrollar upp vid sidbyte)
Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} })

// Utan `globals: true` rensar Testing Library inte DOM:en själv mellan testerna
afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})
