import { useState } from 'react'
import MemberDetail from '../components/MemberDetail'
import MemberNotifications from '../components/MemberNotifications'
import { useSession } from '../session'
import EditMemberPage from './EditMemberPage'

/** Vista del rol Socio: su perfil, préstamos, multas y notificaciones */
export default function MyAccountPage() {
  const { memberId } = useSession()
  const [editing, setEditing] = useState(false)
  // Al cambiar de socio en la cabecera se remonta la ficha para recargarla
  const [version, setVersion] = useState(0)

  if (memberId === null)
    return <p className="text-slate-500">Elige quién eres en el selector de la cabecera para ver tu cuenta.</p>

  if (editing)
    return (
      <EditMemberPage
        memberId={memberId}
        backLabel="Volver a mi cuenta"
        onBack={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          setVersion((v) => v + 1)
        }}
      />
    )

  return (
    <div className="space-y-6">
      <MemberDetail
        key={`${memberId}-${version}`}
        memberId={memberId}
        onChange={() => {}}
        onEdit={() => setEditing(true)}
      />
      <MemberNotifications key={memberId} memberId={memberId} />
    </div>
  )
}
