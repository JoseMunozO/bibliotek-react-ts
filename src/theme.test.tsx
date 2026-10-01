import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ThemeSelect from './components/ThemeSelect'
import { THEME_STORAGE_KEY } from './theme'

const isDark = () => document.documentElement.classList.contains('dark')

/** matchMedia del sistema con un valor inicial y una función para cambiarlo */
function mockSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>()
  const state = { dark }
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return state.dark
        },
        media: query,
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      }) as unknown as MediaQueryList,
  )
  return (next: boolean) => {
    state.dark = next
    act(() => listeners.forEach((fn) => fn()))
  }
}

describe('tema', () => {
  it('por defecto sigue al sistema y reacciona cuando cambia', () => {
    const setSystemDark = mockSystemTheme(true)
    render(<ThemeSelect />)

    expect(screen.getByLabelText('Tema')).toHaveValue('system')
    expect(isDark()).toBe(true)
    setSystemDark(false)
    expect(isDark()).toBe(false)
  })

  it('el tema elegido manda sobre el del sistema y se guarda', async () => {
    const user = userEvent.setup()
    const setSystemDark = mockSystemTheme(false)
    render(<ThemeSelect />)

    await user.selectOptions(screen.getByLabelText('Tema'), 'dark')
    expect(isDark()).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    // Con un tema fijo, los cambios del sistema no le afectan
    setSystemDark(false)
    expect(isDark()).toBe(true)

    await user.selectOptions(screen.getByLabelText('Tema'), 'system')
    expect(isDark()).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('recupera el tema guardado al cargar', () => {
    mockSystemTheme(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeSelect />)

    expect(screen.getByLabelText('Tema')).toHaveValue('dark')
    expect(isDark()).toBe(true)
  })
})
