import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, membersApi, type FineDTO, type LoanDTO, type MemberProfileDTO } from '../api'
import { useSession } from '../session'
import { formatAmount, memberStatusColor, memberStatusLabel, membershipTypeLabel, today } from '../utils'
import Alert from './Alert'
import Badge from './Badge'
import Button from './Button'

interface Props {
  memberId: number
  /** Se llama cuando cambia algo del socio (p. ej. su estado) */
  onChange: () => void
  /** Si se omite, no se muestra el botón Editar */
  onEdit?: () => void
}

export default function MemberDetail({ memberId, onChange, onEdit }: Props) {
  const { can } = useSession()
  const [profile, setProfile] = useState<MemberProfileDTO | null>(null)
  const [loans, setLoans] = useState<LoanDTO[]>([])
  const [fines, setFines] = useState<FineDTO[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    Promise.all([membersApi.get(memberId), membersApi.loans(memberId), membersApi.fines(memberId)])
      .then(([profile, loans, fines]) => {
        setProfile(profile)
        setLoans(loans)
        setFines(fines)
      })
      .catch((e) => setError(getErrorMessage(e)))
  }, [memberId])

  useEffect(() => {
    load()
  }, [load])

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
      setError(null)
      load()
      onChange()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  if (!profile) return error ? <Alert>{error}</Alert> : <p className="text-slate-500">Cargando...</p>

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{profile.fullName}</h2>
          <p className="text-sm text-slate-500">
            {profile.email} · socio desde {profile.membershipDate} · {membershipTypeLabel[profile.membershipType]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={memberStatusColor[profile.status]}>{memberStatusLabel[profile.status]}</Badge>
          {onEdit && (
            <Button variant="secondary" onClick={onEdit}>
              Editar
            </Button>
          )}
          {can.manageMembers && profile.status === 'active' && (
            <Button variant="danger" onClick={() => run(() => membersApi.suspend(memberId))}>
              Suspender
            </Button>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Préstamos activos" value={profile.activeLoansCount} />
        <Stat label="Préstamos totales" value={profile.totalLoansCount} />
        <Stat label="Multas" value={profile.totalFinesCount} />
        <Stat label="Pendiente de pago" value={formatAmount(profile.unpaidFineAmount)} />
      </dl>

      <section>
        <h3 className="mb-2 font-medium text-slate-900">Préstamos</h3>
        {loans.length === 0 ? (
          <p className="text-sm text-slate-500">Sin préstamos.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {loans.map((loan) => (
              <li key={loan.id} className="flex justify-between gap-2 py-2">
                <span>{loan.bookTitle}</span>
                <span className="text-slate-500">
                  {loan.returnDate ? (
                    `Devuelto ${loan.returnDate}`
                  ) : loan.dueDate < today() ? (
                    <Badge color="red">Vencido {loan.dueDate}</Badge>
                  ) : (
                    `Vence ${loan.dueDate}`
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-medium text-slate-900">Multas</h3>
        {fines.length === 0 ? (
          <p className="text-sm text-slate-500">Sin multas.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {fines.map((fine) => (
              <li key={fine.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  {fine.bookTitle} · {formatAmount(fine.amount)}
                  <span className="text-slate-500"> ({fine.issuedDate})</span>
                </span>
                {fine.status === 'pending' ? (
                  can.payFines ? (
                    <Button onClick={() => run(() => membersApi.payFine(memberId, fine.id))}>Pagar</Button>
                  ) : (
                    <Badge color="amber">Pendiente</Badge>
                  )
                ) : (
                  <Badge color="green">Pagada {fine.paidDate}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
