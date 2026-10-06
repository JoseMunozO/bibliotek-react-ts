import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import App from '../App'
import SessionProvider from '../components/SessionProvider'
import { createQueryClient } from '../queryClient'
import { permissionsFor, SessionContext, type Role, type Session } from '../session'
import { vi } from 'vitest'

/** Visar aktuell sökväg så att omdirigeringar kan kontrolleras */
function CurrentLocation() {
  const location = useLocation()
  // En <div> och inte <output>: <output> har role="status" och skulle förväxlas med meddelandena
  return <div data-testid="location">{location.pathname + location.search}</div>
}

/** Ny cache för varje test, och utan nya försök så att fel från backend syns direkt */
const testQueryClient = () => createQueryClient({ retry: false })

/** Renderar hela appen på `path` med rollen (och medlemmen) sparad i sessionen */
export function renderApp(path: string, session?: { role: Role; memberId?: number | null }) {
  if (session) localStorage.setItem('bibliotek.session', JSON.stringify({ memberId: null, ...session }))
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <App />
          <CurrentLocation />
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Renderar en enskild komponent med en fast session och en router i minnet */
export function renderWithSession(ui: ReactElement, role: Role, memberId: number | null = null) {
  const session: Session = { role, memberId, can: permissionsFor(role), setRole: vi.fn(), setMemberId: vi.fn() }
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <MemoryRouter>
        <SessionContext.Provider value={session}>{ui}</SessionContext.Provider>
        <CurrentLocation />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
