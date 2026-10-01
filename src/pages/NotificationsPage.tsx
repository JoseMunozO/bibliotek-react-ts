import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, membersApi, notificationsApi, type MemberDTO, type NotificationDTO } from '../api'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Select } from '../components/Input'
import NewNotificationForm from '../components/NewNotificationForm'
import { notificationTypeLabel } from '../utils'

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
        <MemberNotifications key={memberId} memberId={memberId} />
      )}
    </div>
  )
}

function MemberNotifications({ memberId }: { memberId: number }) {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    membersApi
      .notifications(memberId)
      .then((data) => {
        // Más recientes primero
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
        <h2 className="text-lg font-semibold text-slate-900">
          Notificaciones <Badge color={unread.length ? 'amber' : 'gray'}>{unread.length} sin leer</Badge>
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
            Solo sin leer
          </label>
          <Button
            variant="secondary"
            disabled={unread.length === 0}
            onClick={() => markAsRead(unread.map((n) => n.id))}
          >
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && <p className="text-slate-500">Cargando...</p>}

      {!loading && visible.length === 0 ? (
        <p className="text-sm text-slate-500">
          {onlyUnread ? 'No hay notificaciones sin leer.' : 'Este socio no tiene notificaciones.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((n) => (
            <li
              key={n.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 ${
                n.read ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm ${n.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
                    {notificationTypeLabel(n.type)}
                  </span>
                  <span className="text-xs text-slate-500">{n.sentDate}</span>
                  {n.loanId !== null && <span className="text-xs text-slate-500">· préstamo #{n.loanId}</span>}
                </div>
                <p className="text-sm text-slate-700">{n.message}</p>
              </div>
              {n.read ? (
                <Badge>Leída</Badge>
              ) : (
                <Button variant="secondary" onClick={() => markAsRead([n.id])}>
                  Marcar como leída
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <NewNotificationForm memberId={memberId} onCreated={load} />
    </div>
  )
}
