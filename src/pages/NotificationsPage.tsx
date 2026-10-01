import { useEffect, useState } from 'react'
import { getErrorMessage, membersApi, type MemberDTO } from '../api'
import Alert from '../components/Alert'
import { Select } from '../components/Input'
import MemberNotifications from '../components/MemberNotifications'

export default function NotificationsPage() {
  const [members, setMembers] = useState<MemberDTO[]>([])
  const [memberId, setMemberId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    membersApi
      .list()
      .then(setMembers)
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  return (
    <div className="space-y-6">
      <label className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
        Socio
        <Select
          value={memberId ?? ''}
          onChange={(e) => setMemberId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecciona un socio...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>
      </label>

      {error && <Alert>{error}</Alert>}

      {memberId === null ? (
        <p className="text-slate-500">Selecciona un socio para ver sus notificaciones.</p>
      ) : (
        <MemberNotifications key={memberId} memberId={memberId} canSend />
      )}
    </div>
  )
}
