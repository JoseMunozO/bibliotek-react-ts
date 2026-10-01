import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, membersApi, type MemberDTO } from '../api'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import MemberDetail from '../components/MemberDetail'
import NewMemberForm from '../components/NewMemberForm'
import EditMemberPage from './EditMemberPage'
import { useSession } from '../session'
import { memberStatusColor, memberStatusLabel } from '../utils'

export default function MembersPage() {
  const { can } = useSession()
  const [members, setMembers] = useState<MemberDTO[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const loadMembers = useCallback(() => {
    membersApi
      .list()
      .then((data) => {
        setMembers(data)
        setError(null)
      })
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  if (editing && selectedId !== null)
    return (
      <EditMemberPage
        memberId={selectedId}
        onBack={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          loadMembers()
        }}
      />
    )

  return (
    <div className="space-y-6">
      {can.manageMembers && (
        <NewMemberForm
          onCreated={(member) => {
            loadMembers()
            setSelectedId(member.id)
          }}
        />
      )}

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <ul className="divide-y divide-slate-200 self-start rounded-lg border border-slate-200 bg-white">
          {members.map((member) => (
            <li key={member.id}>
              <button
                onClick={() => setSelectedId(member.id)}
                className={`flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-slate-50 ${
                  member.id === selectedId ? 'bg-indigo-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-slate-900">{member.fullName}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
                <Badge color={memberStatusColor[member.status]}>{memberStatusLabel[member.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>

        {selectedId === null ? (
          <p className="text-slate-500">Selecciona un socio para ver su ficha.</p>
        ) : (
          <MemberDetail
            key={selectedId}
            memberId={selectedId}
            onChange={loadMembers}
            onEdit={can.manageMembers ? () => setEditing(true) : undefined}
          />
        )}
      </div>
    </div>
  )
}
