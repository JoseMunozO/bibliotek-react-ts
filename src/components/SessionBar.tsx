import { useEffect, useState } from 'react'
import { getErrorMessage, membersApi, type MemberDTO } from '../api'
import { roleLabel, useSession, type Role } from '../session'
import { Select } from './Input'

/** Selector de rol (y de socio, para el rol "Socio") en la cabecera */
export default function SessionBar() {
  const { role, memberId, setRole, setMemberId } = useSession()
  const [members, setMembers] = useState<MemberDTO[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (role !== 'user') return
    membersApi
      .list()
      .then((data) => {
        setMembers(data)
        setError(null)
      })
      .catch((e) => setError(getErrorMessage(e)))
  }, [role])

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Select value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Rol">
        {(Object.keys(roleLabel) as Role[]).map((r) => (
          <option key={r} value={r}>
            {roleLabel[r]}
          </option>
        ))}
      </Select>
      {role === 'user' && (
        <Select
          value={memberId ?? ''}
          onChange={(e) => setMemberId(e.target.value ? Number(e.target.value) : null)}
          aria-label="Socio actual"
          className="max-w-52"
          title={error ?? undefined}
        >
          <option value="">{error ? 'Error al cargar socios' : '¿Quién eres?'}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>
      )}
    </div>
  )
}
