import { createContext, useContext } from 'react'

// Det finns ingen autentisering: roll och aktuell medlem väljs i sidhuvudet,
// precis som i den ursprungliga konsolmenyn (User / Librarian / Admin).

export type Role = 'user' | 'librarian' | 'admin'

export const roleLabel: Record<Role, string> = {
  user: 'Medlem',
  librarian: 'Bibliotekarie',
  admin: 'Administratör',
}

/** Vad varje roll får göra, enligt menyerna i konsolprogrammet */
export function permissionsFor(role: Role) {
  const staff = role !== 'user'
  return {
    /** Se medlemslistan och medlemmarnas profiler */
    viewMembers: staff,
    /** Registrera, redigera vilken medlem som helst och stänga av */
    manageMembers: role === 'admin',
    /** Låna ut, ta emot återlämningar, förlänga och se försenade lån */
    manageLoans: staff,
    payFines: staff,
    /** Se och skicka aviseringar till vilken medlem som helst */
    manageNotifications: staff,
    /** Recensera i vilken medlems namn som helst (en medlem bara i sitt eget) */
    reviewAsAnyMember: staff,
    /** Ändra medlemskapstyp när en medlem redigeras */
    changeMembershipType: role === 'admin',
  }
}

export type Permissions = ReturnType<typeof permissionsFor>

export interface Session {
  role: Role
  /** Medlemmen som rollen "Medlem" agerar som */
  memberId: number | null
  can: Permissions
  setRole: (role: Role) => void
  setMemberId: (memberId: number | null) => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession måste användas inuti <SessionProvider>')
  return session
}
