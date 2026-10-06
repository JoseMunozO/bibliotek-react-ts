import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { permissionsFor, SessionContext, type Role } from '../session'

const STORAGE_KEY = 'bibliotek.session'
const roles: Role[] = ['user', 'librarian', 'admin']

function loadStored(): { role: Role; memberId: number | null } {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      role: roles.includes(stored.role) ? stored.role : 'admin',
      memberId: typeof stored.memberId === 'number' ? stored.memberId : null,
    }
  } catch {
    return { role: 'admin', memberId: null }
  }
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadStored)
  const [role, setRole] = useState<Role>(initial.role)
  const [memberId, setMemberId] = useState<number | null>(initial.memberId)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, memberId }))
    } catch {
      // Utan lagring (privat läge): sessionen gäller tills sidan laddas om
    }
  }, [role, memberId])

  const session = useMemo(
    () => ({ role, memberId, can: permissionsFor(role), setRole, setMemberId }),
    [role, memberId],
  )

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
