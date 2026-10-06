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
  /** Anropas när något ändras hos medlemmen (t.ex. status) */
  onChange: () => void
  /** Om den utelämnas visas inte knappen Redigera */
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
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
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
            {profile.email} · medlem sedan {profile.membershipDate} · {membershipTypeLabel[profile.membershipType]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={memberStatusColor[profile.status]}>{memberStatusLabel[profile.status]}</Badge>
          {onEdit && (
            <Button variant="secondary" onClick={onEdit}>
              Redigera
            </Button>
          )}
          {can.manageMembers && profile.status === 'active' && (
            <Button variant="danger" onClick={() => run(() => membersApi.suspend(memberId))}>
              Stäng av
            </Button>
          )}
        </div>
      </div>

      <Alert message={error} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Aktiva lån" value={profile.activeLoansCount} />
        <Stat label="Lån totalt" value={profile.totalLoansCount} />
        <Stat label="Böter" value={profile.totalFinesCount} />
        <Stat label="Att betala" value={formatAmount(profile.unpaidFineAmount)} />
      </dl>

      <section>
        <h3 className="mb-2 font-medium text-ink">Lån</h3>
        {loans.length === 0 ? (
          <p className="text-sm text-muted">Inga lån.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {loans.map((loan) => (
              <li key={loan.id} className="flex justify-between gap-2 py-2">
                <span>{loan.bookTitle}</span>
                <span className="text-muted">
                  {loan.returnDate ? (
                    `Återlämnad ${loan.returnDate}`
                  ) : loan.dueDate < today() ? (
                    <Badge color="red">Försenad {loan.dueDate}</Badge>
                  ) : (
                    `Förfaller ${loan.dueDate}`
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-medium text-ink">Böter</h3>
        {fines.length === 0 ? (
          <p className="text-sm text-muted">Inga böter.</p>
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
                    <Button onClick={() => run(() => membersApi.payFine(memberId, fine.id))}>Betala</Button>
                  ) : (
                    <Badge color="amber">Obetald</Badge>
                  )
                ) : (
                  <Badge color="green">Betald {fine.paidDate}</Badge>
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
