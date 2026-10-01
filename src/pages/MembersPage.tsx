import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { getErrorMessage, membersApi, type MemberDTO } from '../api'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import MemberDetail from '../components/MemberDetail'
import NewMemberForm from '../components/NewMemberForm'
import EditMemberPage from './EditMemberPage'
import { parseId } from '../navigation'
import { useSession } from '../session'
import { memberStatusColor, memberStatusLabel } from '../utils'

/** Rutas /socios y /socios/:id */
export default function MembersPage() {
  const { can } = useSession()
  const navigate = useNavigate()
  const selectedId = parseId(useParams().id)
  const [members, setMembers] = useState<MemberDTO[]>([])
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      {can.manageMembers && (
        <NewMemberForm
          onCreated={(member) => {
            loadMembers()
            navigate(`/socios/${member.id}`)
          }}
        />
      )}

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <ul className="divide-y divide-slate-200 self-start rounded-lg border border-slate-200 bg-white">
          {members.map((member) => (
            <li key={member.id}>
              <Link
                to={`/socios/${member.id}`}
                className={`flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-slate-50 ${
                  member.id === selectedId ? 'bg-indigo-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-slate-900">{member.fullName}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
                <Badge color={memberStatusColor[member.status]}>{memberStatusLabel[member.status]}</Badge>
              </Link>
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
            onEdit={can.manageMembers ? () => navigate(`/socios/${selectedId}/editar`) : undefined}
          />
        )}
      </div>
    </div>
  )
}

/** Ruta /socios/:id/editar (solo administrador) */
export function EditMemberRoute() {
  const navigate = useNavigate()
  const memberId = parseId(useParams().id)
  if (memberId === null) return <Navigate to="/socios" replace />
  const back = () => navigate(`/socios/${memberId}`)
  return <EditMemberPage memberId={memberId} onBack={back} onSaved={back} />
}
