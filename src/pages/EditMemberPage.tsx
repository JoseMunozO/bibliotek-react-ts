import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { getErrorMessage, type MembershipType, type UpdateMemberRequest } from '../api'
import { firstError, memberQueries, useUpdateMember } from '../api/queries'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import Button from '../components/Button'
import { Input, Select } from '../components/Input'
import { useSession } from '../session'
import { membershipTypeLabel } from '../utils'

interface Props {
  memberId: number
  onBack: () => void
  onSaved: () => void
  backLabel?: string
}

export default function EditMemberPage({ memberId, onBack, onSaved, backLabel = 'Tillbaka till medlemmar' }: Props) {
  const { data: member, error } = useQuery(memberQueries.get(memberId))

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="secondary" onClick={onBack}>
        ← {backLabel}
      </Button>

      {!member && !error && <Loading />}
      {!member && <Alert message={firstError(error)} />}

      {member && (
        // Formuläret startar med uppgifterna en gång: en omladdning i bakgrunden skriver inte över det som skrivs
        <EditMemberForm
          memberId={memberId}
          initial={{
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            membershipType: member.membershipType,
          }}
          onBack={onBack}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

interface FormProps {
  memberId: number
  initial: UpdateMemberRequest
  onBack: () => void
  onSaved: () => void
}

function EditMemberForm({ memberId, initial, onBack, onSaved }: FormProps) {
  const { can } = useSession()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const updateMember = useUpdateMember(memberId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setError(null)
    try {
      await updateMember.mutateAsync(form)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold text-ink">Redigera medlem</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Förnamn">
          <Input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full"
          />
        </Field>
        <Field label="Efternamn">
          <Input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full"
          />
        </Field>
      </div>

      <Field label="E-post">
        <Input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full"
        />
      </Field>

      <Field label="Medlemskapstyp">
        <Select
          value={form.membershipType}
          onChange={(e) => setForm({ ...form, membershipType: e.target.value as MembershipType })}
          disabled={!can.changeMembershipType}
          title={can.changeMembershipType ? undefined : 'Endast en administratör kan ändra den'}
          className="w-full disabled:bg-surface-alt disabled:text-muted"
        >
          {(Object.keys(membershipTypeLabel) as MembershipType[]).map((type) => (
            <option key={type} value={type}>
              {membershipTypeLabel[type]}
            </option>
          ))}
        </Select>
      </Field>

      <Alert message={error} />

      <div className="flex gap-2">
        <Button type="submit" disabled={updateMember.isPending}>
          {updateMember.isPending ? 'Sparar …' : 'Spara ändringar'}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
