import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, loansApi, type LoanDTO, type OverdueLoanDTO } from '../api'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Input } from '../components/Input'
import NewLoanForm from '../components/NewLoanForm'
import { formatAmount, today } from '../utils'

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanDTO[]>([])
  const [overdue, setOverdue] = useState<OverdueLoanDTO[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // Al crear un préstamo se remonta el formulario para recargar socios y libros
  const [formKey, setFormKey] = useState(0)

  const load = useCallback(() => {
    Promise.all([loansApi.list(), loansApi.overdue()])
      .then(([loans, overdue]) => {
        setLoans(loans)
        setOverdue(overdue)
      })
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function run(action: () => Promise<string>) {
    // Vaciar los avisos antes de enviar: así un mismo error repetido se vuelve a anunciar
    setError(null)
    setSuccess(null)
    try {
      setSuccess(await action())
      setError(null)
      load()
    } catch (e) {
      setSuccess(null)
      setError(getErrorMessage(e))
    }
  }

  const handleReturn = (loan: LoanDTO) =>
    run(async () => {
      const { fineAmount } = await loansApi.return(loan.id)
      setFormKey((k) => k + 1) // hay un ejemplar más disponible
      return fineAmount > 0
        ? `"${loan.bookTitle}" devuelto con retraso. Multa: ${formatAmount(fineAmount)}`
        : `"${loan.bookTitle}" devuelto a tiempo.`
    })

  const handleExtend = (loan: LoanDTO, days: number) =>
    run(async () => {
      const updated = await loansApi.extend(loan.id, days)
      return `"${loan.bookTitle}" prorrogado hasta ${updated.dueDate}.`
    })

  return (
    <div className="space-y-6">
      <NewLoanForm
        key={formKey}
        onCreated={() => {
          setSuccess('Préstamo creado.')
          setError(null)
          load()
        }}
      />

      <Alert message={error} />
      <Alert type="success" message={success} />

      <section>
        <h2 className="mb-2 font-medium text-slate-900">Préstamos activos ({loans.length})</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-slate-500">No hay préstamos activos.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {loans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} onReturn={handleReturn} onExtend={handleExtend} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium text-slate-900">Vencidos ({overdue.length})</h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-slate-500">No hay préstamos vencidos.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-red-200 bg-white text-sm">
            {overdue.map((o) => (
              <li key={o.loanId} className="flex flex-wrap justify-between gap-2 p-3">
                <span className="font-medium text-slate-900">{o.bookTitle}</span>
                <span className="text-slate-500">
                  {o.memberName} ({o.memberEmail}) · vencido el {o.dueDate}
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
        <p className="font-medium text-slate-900">{loan.bookTitle}</p>
        <p className="text-sm text-slate-500">
          {loan.memberName ?? `Socio #${loan.memberId}`} · prestado el {loan.loanDate}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isOverdue ? <Badge color="red">Vencido {loan.dueDate}</Badge> : <Badge>Vence {loan.dueDate}</Badge>}
        {!isOverdue && (
          <>
            <Input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-16"
              aria-label="Días de prórroga"
            />
            <Button variant="secondary" disabled={days < 1} onClick={() => onExtend(loan, days)}>
              Prorrogar
            </Button>
          </>
        )}
        <Button onClick={() => onReturn(loan)}>Devolver</Button>
      </div>
    </li>
  )
}
