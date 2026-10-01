import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, membersApi, type FineDTO, type LoanDTO, type MemberProfileDTO } from '../api'
import { useSession } from '../session'
import { formatAmount, memberStatusColor, memberStatusLabel, membershipTypeLabel, today } from '../utils'
import Alert from './Alert'
import Loading from './Loading'
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
    // Vaciar los avisos antes de enviar: así un mismo error repetido se vuelve a anunciar
    setError(null)
    try {
      await action()
      setError(null)
      load()
      onChange()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  if (!profile) return error ? <Alert message={error} /> : <Loading />

  return (
    <div className="space-y-5 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{profile.fullName}</h2>
          <p className="text-sm text-muted">
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

      <Alert message={error} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Préstamos activos" value={profile.activeLoansCount} />
        <Stat label="Préstamos totales" value={profile.totalLoansCount} />
        <Stat label="Multas" value={profile.totalFinesCount} />
        <Stat label="Pendiente de pago" value={formatAmount(profile.unpaidFineAmount)} />
      </dl>

      <section>
        <h3 className="mb-2 font-medium text-ink">Préstamos</h3>
        {loans.length === 0 ? (
          <p className="text-sm text-muted">Sin préstamos.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {loans.map((loan) => (
              <li key={loan.id} className="flex justify-between gap-2 py-2">
                <span>{loan.bookTitle}</span>
                <span className="text-muted">
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
        <h3 className="mb-2 font-medium text-ink">Multas</h3>
        {fines.length === 0 ? (
          <p className="text-sm text-muted">Sin multas.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {fines.map((fine) => (
              <li key={fine.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  {fine.bookTitle} · {formatAmount(fine.amount)}
                  <span className="text-muted"> ({fine.issuedDate})</span>
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
    <div className="rounded-lg bg-surface-alt p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold text-ink">{value}</dd>
    </div>
  )
}
