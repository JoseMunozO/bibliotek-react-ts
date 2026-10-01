import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import App from '../App'
import SessionProvider from '../components/SessionProvider'
import { permissionsFor, SessionContext, type Role, type Session } from '../session'
import { vi } from 'vitest'

/** Muestra la ruta actual para poder comprobar redirecciones */
function CurrentLocation() {
  const location = useLocation()
  // Un <div> y no <output>: <output> tiene role="status" y se confundiría con los avisos
  return <div data-testid="location">{location.pathname + location.search}</div>
}

/** Renderiza la app completa en `path` con el rol (y socio) guardados en la sesión */
export function renderApp(path: string, session?: { role: Role; memberId?: number | null }) {
  if (session) localStorage.setItem('bibliotek.session', JSON.stringify({ memberId: null, ...session }))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
        <CurrentLocation />
      </SessionProvider>
    </MemoryRouter>,
  )
}

/** Renderiza un componente suelto con una sesión fija y un router en memoria */
export function renderWithSession(ui: ReactElement, role: Role, memberId: number | null = null) {
  const session: Session = { role, memberId, can: permissionsFor(role), setRole: vi.fn(), setMemberId: vi.fn() }
  return render(
    <MemoryRouter>
      <SessionContext.Provider value={session}>{ui}</SessionContext.Provider>
      <CurrentLocation />
    </MemoryRouter>,
  )
}
