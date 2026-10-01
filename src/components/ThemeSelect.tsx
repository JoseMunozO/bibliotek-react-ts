import { themeLabel, useTheme, type Theme } from '../theme'
import { Select } from './Input'

export default function ThemeSelect() {
  const [theme, setTheme] = useTheme()

  return (
    <Select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} aria-label="Tema">
      {(Object.keys(themeLabel) as Theme[]).map((t) => (
        <option key={t} value={t}>
          {t === 'system' ? `Tema: ${themeLabel[t]}` : themeLabel[t]}
        </option>
      ))}
    </Select>
  )
}
