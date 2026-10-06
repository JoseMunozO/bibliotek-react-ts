import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, membersApi, notificationsApi, type NotificationDTO } from '../api'
import { notificationTypeLabel } from '../utils'
import Alert from './Alert'
import Loading from './Loading'
import Badge from './Badge'
import Button from './Button'
import NewNotificationForm from './NewNotificationForm'

interface Props {
  memberId: number
  /** Visar formuläret för att skicka aviseringar (endast personal) */
  canSend?: boolean
}

export default function MemberNotifications({ memberId, canSend = false }: Props) {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    membersApi
      .notifications(memberId)
      .then((data) => {
        // Senaste först
        setNotifications(data.toSorted((a, b) => b.sentDate.localeCompare(a.sentDate) || b.id - a.id))
        setError(null)
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [memberId])

  useEffect(() => {
    load()
  }, [load])

  async function markAsRead(ids: number[]) {
    try {
      await Promise.all(ids.map((id) => notificationsApi.markAsRead(id)))
    } catch (e) {
      setError(getErrorMessage(e))
    }
    load()
  }

  const unread = notifications.filter((n) => !n.read)
  const visible = onlyUnread ? unread : notifications

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">
          Aviseringar <Badge color={unread.length ? 'amber' : 'gray'}>{unread.length} olästa</Badge>
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
            Endast olästa
          </label>
          <Button
            variant="secondary"
            disabled={unread.length === 0}
            onClick={() => markAsRead(unread.map((n) => n.id))}
          >
            Markera alla som lästa
          </Button>
        </div>
      </div>

      <Alert message={error} />
      {loading && <Loading />}

      {!loading && visible.length === 0 ? (
        <p className="text-sm text-muted">
          {onlyUnread ? 'Det finns inga olästa aviseringar.' : 'Den här medlemmen har inga aviseringar.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((n) => (
            <li
              key={n.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 ${
                n.read ? 'border-line bg-surface'
                  : 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm ${n.read ? 'text-ink-soft' : 'font-semibold text-ink'}`}>
                    {notificationTypeLabel(n.type)}
                  </span>
                  <span className="text-xs text-muted">{n.sentDate}</span>
                  {n.loanId !== null && <span className="text-xs text-muted">· lån #{n.loanId}</span>}
                </div>
                <p className="text-sm text-ink-soft">{n.message}</p>
              </div>
              {n.read ? (
                <Badge>Läst</Badge>
              ) : (
                <Button variant="secondary" onClick={() => markAsRead([n.id])}>
                  Markera som läst
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canSend && <NewNotificationForm memberId={memberId} onCreated={load} />}
    </div>
  )
}
