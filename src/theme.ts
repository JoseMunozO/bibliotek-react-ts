import { useEffect, useState } from 'react'

// Valt tema sparas i localStorage; "system" följer systemets inställning.
// index.html gör samma beräkning innan sidan ritas, så att den inte blinkar till i ljust läge.

export type Theme = 'system' | 'light' | 'dark'

export const themeLabel: Record<Theme, string> = {
  system: 'System',
  light: 'Ljust',
  dark: 'Mörkt',
}

export const THEME_STORAGE_KEY = 'bibliotek.theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && darkQuery().matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Aktuellt tema och en funktion för att byta det; med "system" följer det ändringar i systemet */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(storedTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Utan lagring: temat gäller tills sidan laddas om
    }
    if (theme !== 'system') return
    const query = darkQuery()
    const onChange = () => applyTheme('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  return [theme, setTheme] as const
}
