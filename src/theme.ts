import { useEffect, useState } from 'react'

// El tema elegido se guarda en localStorage; "system" sigue la preferencia del sistema.
// index.html aplica el mismo cálculo antes de pintar para evitar un destello en claro.

export type Theme = 'system' | 'light' | 'dark'

export const themeLabel: Record<Theme, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Oscuro',
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

/** Tema actual y función para cambiarlo; con "system" reacciona a los cambios del sistema */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(storedTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Sin almacenamiento: el tema dura hasta recargar
    }
    if (theme !== 'system') return
    const query = darkQuery()
    const onChange = () => applyTheme('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  return [theme, setTheme] as const
}
