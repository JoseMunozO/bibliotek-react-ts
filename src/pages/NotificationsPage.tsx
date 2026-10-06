import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { firstError, memberQueries } from '../api/queries'
import Alert from '../components/Alert'
import { Select } from '../components/Input'
import MemberNotifications from '../components/MemberNotifications'
import { parseId } from '../navigation'

export default function NotificationsPage() {
  const { data: members = [], error: membersError } = useQuery(memberQueries.list())
  const [searchParams, setSearchParams] = useSearchParams()
  const memberId = parseId(searchParams.get('medlem'))
  const error = firstError(membersError)

  return (
    <div className="space-y-6">
      <label className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
        Medlem
        <Select
          value={memberId ?? ''}
          onChange={(e) => setSearchParams(e.target.value ? { medlem: e.target.value } : {})}
        >
          <option value="">Välj en medlem …</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>
      </label>

      <Alert message={error} />

      {memberId === null ? (
        <p className="text-muted">Välj en medlem för att se aviseringarna.</p>
      ) : (
        <MemberNotifications key={memberId} memberId={memberId} canSend />
      )}
    </div>
  )
}
