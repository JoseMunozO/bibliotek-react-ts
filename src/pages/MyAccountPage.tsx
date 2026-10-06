import { useNavigate } from 'react-router'
import MemberDetail from '../components/MemberDetail'
import MemberNotifications from '../components/MemberNotifications'
import { useSession } from '../session'
import EditMemberPage from './EditMemberPage'

const chooseMember = (
  <p className="text-muted">Välj vem du är i sidhuvudet för att se ditt konto.</p>
)

/** Sökvägen /mitt-konto: vyn för rollen Medlem med profil, lån, böter och aviseringar */
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

/** Sökvägen /mitt-konto/redigera */
export function EditMyAccountPage() {
  const { memberId } = useSession()
  const navigate = useNavigate()

  if (memberId === null) return chooseMember

  const back = () => navigate('/mitt-konto')
  return <EditMemberPage key={memberId} memberId={memberId} backLabel="Tillbaka till mitt konto" onBack={back} onSaved={back} />
}
