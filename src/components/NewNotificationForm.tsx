import { useEffect, useState, type FormEvent } from 'react'
import { getErrorMessage, membersApi, notificationsApi, type LoanDTO } from '../api'
import { notificationTypeLabel, notificationTypes } from '../utils'
import Alert from './Alert'
import Button from './Button'
import { Select } from './Input'

interface Props {
  memberId: number
  onCreated: () => void
}

export default function NewNotificationForm({ memberId, onCreated }: Props) {
  const [loans, setLoans] = useState<LoanDTO[]>([])
  const [type, setType] = useState(notificationTypes[0])
  const [loanId, setLoanId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    membersApi
      .loans(memberId)
      .then((loans) => setLoans(loans.filter((l) => l.returnDate === null)))
      .catch((e) => setError(getErrorMessage(e)))
  }, [memberId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess(null)
    setSaving(true)
    try {
      await notificationsApi.create({
        memberId,
        type,
        message,
        loanId: loanId ? Number(loanId) : undefined,
      })
      setMessage('')
      setLoanId('')
      setError(null)
      setSuccess('Notificación enviada.')
      onCreated()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-medium text-slate-900">Enviar notificación</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {notificationTypes.map((t) => (
            <option key={t} value={t}>
              {notificationTypeLabel(t)}
            </option>
          ))}
        </Select>
        <Select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
          <option value="">Sin préstamo asociado</option>
          {loans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.bookTitle} (vence {l.dueDate})
            </option>
          ))}
        </Select>
      </div>
      <textarea
        required
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Mensaje para el socio"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      {error && <Alert>{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Enviando...' : 'Enviar'}
      </Button>
    </form>
  )
}
