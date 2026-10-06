import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getErrorMessage, type LoanDTO } from '../api'
import { firstError, loanQueries, useExtendLoan, useReturnLoan } from '../api/queries'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Input } from '../components/Input'
import NewLoanForm from '../components/NewLoanForm'
import { formatAmount, today } from '../utils'

export default function LoansPage() {
  const { data: loans = [], error: loansError } = useQuery(loanQueries.active())
  const { data: overdue = [], error: overdueError } = useQuery(loanQueries.overdue())
  const returnLoan = useReturnLoan()
  const extendLoan = useExtendLoan()
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const error = actionError ?? firstError(loansError, overdueError)

  // Listorna, formulärets lediga böcker och medlemmarnas uppgifter laddas om av mutationerna
  async function run(action: () => Promise<string>) {
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setActionError(null)
    setSuccess(null)
    try {
      setSuccess(await action())
    } catch (e) {
      setActionError(getErrorMessage(e))
    }
  }

  const handleReturn = (loan: LoanDTO) =>
    run(async () => {
      const { fineAmount } = await returnLoan.mutateAsync(loan.id)
      return fineAmount > 0
        ? `"${loan.bookTitle}" återlämnad för sent. Böter: ${formatAmount(fineAmount)}`
        : `"${loan.bookTitle}" återlämnad i tid.`
    })

  const handleExtend = (loan: LoanDTO, days: number) =>
    run(async () => {
      const updated = await extendLoan.mutateAsync({ id: loan.id, days })
      return `"${loan.bookTitle}" förlängd till ${updated.dueDate}.`
    })

  return (
    <div className="space-y-6">
      <NewLoanForm
        onCreated={() => {
          setSuccess('Lånet har skapats.')
          setActionError(null)
        }}
      />

      <Alert message={error} />
      <Alert type="success" message={success} />

      <section>
        <h2 className="mb-2 font-medium text-ink">Aktiva lån ({loans.length})</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-muted">Det finns inga aktiva lån.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {loans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} onReturn={handleReturn} onExtend={handleExtend} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium text-ink">Försenade ({overdue.length})</h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-muted">Det finns inga försenade lån.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-red-200 bg-surface dark:border-red-500/40 text-sm">
            {overdue.map((o) => (
              <li key={o.loanId} className="flex flex-wrap justify-between gap-2 p-3">
                <span className="font-medium text-ink">{o.bookTitle}</span>
                <span className="text-muted">
                  {o.memberName} ({o.memberEmail}) · förföll {o.dueDate}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

interface LoanRowProps {
  loan: LoanDTO
  onReturn: (loan: LoanDTO) => void
  onExtend: (loan: LoanDTO, days: number) => void
}

function LoanRow({ loan, onReturn, onExtend }: LoanRowProps) {
  const [days, setDays] = useState(7)
  const isOverdue = loan.dueDate < today()

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div>
        <p className="font-medium text-ink">{loan.bookTitle}</p>
        <p className="text-sm text-muted">
          {loan.memberName ?? `Medlem #${loan.memberId}`} · utlånad {loan.loanDate}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isOverdue ? <Badge color="red">Försenad {loan.dueDate}</Badge> : <Badge>Förfaller {loan.dueDate}</Badge>}
        {!isOverdue && (
          <>
            <Input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-16"
              aria-label="Dagar att förlänga"
            />
            <Button variant="secondary" disabled={days < 1} onClick={() => onExtend(loan, days)}>
              Förläng
            </Button>
          </>
        )}
        <Button onClick={() => onReturn(loan)}>Återlämna</Button>
      </div>
    </li>
  )
}
