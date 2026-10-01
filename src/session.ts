import { createContext, useContext } from 'react'

// No hay autenticación: el rol y el socio actual se eligen en la cabecera,
// igual que en el menú de consola original (User / Librarian / Admin).

export type Role = 'user' | 'librarian' | 'admin'

export const roleLabel: Record<Role, string> = {
  user: 'Socio',
  librarian: 'Bibliotecario',
  admin: 'Administrador',
}

/** Qué puede hacer cada rol, según los menús de la aplicación de consola */
export function permissionsFor(role: Role) {
  const staff = role !== 'user'
  return {
    /** Ver la lista de socios y sus fichas */
    viewMembers: staff,
    /** Dar de alta, editar cualquier socio y suspender */
    manageMembers: role === 'admin',
    /** Prestar, devolver, prorrogar y ver vencidos */
    manageLoans: staff,
    payFines: staff,
    /** Ver y enviar notificaciones de cualquier socio */
    manageNotifications: staff,
    /** Reseñar en nombre de cualquier socio (el socio solo en el suyo) */
    reviewAsAnyMember: staff,
    /** Cambiar el tipo de membresía al editar un socio */
    changeMembershipType: role === 'admin',
  }
}

export type Permissions = ReturnType<typeof permissionsFor>

export interface Session {
  role: Role
  /** Socio con el que actúa el rol "Socio" */
  memberId: number | null
  can: Permissions
  setRole: (role: Role) => void
  setMemberId: (memberId: number | null) => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession debe usarse dentro de <SessionProvider>')
  return session
}
