import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ThemeSelect from './components/ThemeSelect'
import { THEME_STORAGE_KEY } from './theme'

const isDark = () => document.documentElement.classList.contains('dark')

/** Systemets matchMedia med ett startvärde och en funktion för att ändra det */
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
  it('följer systemet som standard och reagerar när det ändras', () => {
    const setSystemDark = mockSystemTheme(true)
    render(<ThemeSelect />)

    expect(screen.getByLabelText('Tema')).toHaveValue('system')
    expect(isDark()).toBe(true)
    setSystemDark(false)
    expect(isDark()).toBe(false)
  })

  it('valt tema går före systemets och sparas', async () => {
    const user = userEvent.setup()
    const setSystemDark = mockSystemTheme(false)
    render(<ThemeSelect />)

    await user.selectOptions(screen.getByLabelText('Tema'), 'dark')
    expect(isDark()).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    // Med ett fast tema påverkas det inte av ändringar i systemet
    setSystemDark(false)
    expect(isDark()).toBe(true)

    await user.selectOptions(screen.getByLabelText('Tema'), 'system')
    expect(isDark()).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('läser in sparat tema vid start', () => {
    mockSystemTheme(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeSelect />)

    expect(screen.getByLabelText('Tema')).toHaveValue('dark')
    expect(isDark()).toBe(true)
  })
})
