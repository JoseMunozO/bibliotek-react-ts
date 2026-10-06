import { useNavigate } from 'react-router'
import MemberDetail from '../components/MemberDetail'
import MemberNotifications from '../components/MemberNotifications'
import { useSession } from '../session'
import EditMemberPage from './EditMemberPage'

const chooseMember = (
  <p className="text-muted">Elige quién eres en el selector de la cabecera para ver tu cuenta.</p>
)

/** Ruta /mitt-konto: vista del rol Socio con su perfil, préstamos, multas y notificaciones */
export default function MyAccountPage() {
  const { memberId } = useSession()
  const navigate = useNavigate()

  if (memberId === null) return chooseMember

  return (
    <div className="space-y-6">
      <MemberDetail key={memberId} memberId={memberId} onChange={() => {}} onEdit={() => navigate('/mitt-konto/redigera')} />
      <MemberNotifications key={memberId} memberId={memberId} />
    </div>
  )
}

/** Ruta /mitt-konto/redigera */
export function EditMyAccountPage() {
  const { memberId } = useSession()
  const navigate = useNavigate()

  if (memberId === null) return chooseMember

  const back = () => navigate('/mitt-konto')
  return <EditMemberPage key={memberId} memberId={memberId} backLabel="Volver a mi cuenta" onBack={back} onSaved={back} />
}
