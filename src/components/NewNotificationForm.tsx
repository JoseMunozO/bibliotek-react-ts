import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getErrorMessage, type LoanDTO } from '../api'
import { firstError, memberQueries, useCreateNotification } from '../api/queries'
import { notificationTypeLabel, notificationTypes } from '../utils'
import Alert from './Alert'
import Button from './Button'
import { Select } from './Input'

interface Props {
  memberId: number
}

const activeLoans = (loans: LoanDTO[]) => loans.filter((l) => l.returnDate === null)

/** Listan med aviseringar laddas om av sig själv när en avisering skickas */
export default function NewNotificationForm({ memberId }: Props) {
  const loansQuery = useQuery({ ...memberQueries.loans(memberId), select: activeLoans })
  const loans = loansQuery.data ?? []
  const createNotification = useCreateNotification(memberId)
  const [type, setType] = useState(notificationTypes[0])
  const [loanId, setLoanId] = useState('')
  const [message, setMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const error = submitError ?? firstError(loansQuery.error)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setSubmitError(null)
    setSuccess(null)
    try {
      await createNotification.mutateAsync({
        memberId,
        type,
        message,
        loanId: loanId ? Number(loanId) : undefined,
      })
      setMessage('')
      setLoanId('')
      setSuccess('Aviseringen har skickats.')
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h3 className="font-medium text-ink">Skicka avisering</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {notificationTypes.map((t) => (
            <option key={t} value={t}>
              {notificationTypeLabel(t)}
            </option>
          ))}
        </Select>
        <Select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
          <option value="">Inget kopplat lån</option>
          {loans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.bookTitle} (förfaller {l.dueDate})
            </option>
          ))}
        </Select>
      </div>
      <textarea
        required
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Meddelande till medlemmen"
        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <Alert message={error} />
      <Alert type="success" message={success} />
      <Button type="submit" disabled={createNotification.isPending}>
        {createNotification.isPending ? 'Skickar …' : 'Skicka'}
      </Button>
    </form>
  )
}
