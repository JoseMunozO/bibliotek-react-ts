import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { getErrorMessage, membersApi, type MembershipType, type UpdateMemberRequest } from '../api'
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
  const { can } = useSession()
  const [form, setForm] = useState<UpdateMemberRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    membersApi
      .get(memberId)
      .then(({ firstName, lastName, email, membershipType }) =>
        setForm({ firstName, lastName, email, membershipType }),
      )
      .catch((e) => setError(getErrorMessage(e)))
  }, [memberId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setError(null)
    setSaving(true)
    try {
      await membersApi.update(memberId, form)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="secondary" onClick={onBack}>
        ← {backLabel}
      </Button>

      {!form && !error && <Loading />}
      {!form && <Alert message={error} />}

      {form && (
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
            <Button type="submit" disabled={saving}>
              {saving ? 'Sparar …' : 'Spara ändringar'}
            </Button>
            <Button type="button" variant="secondary" onClick={onBack}>
              Avbryt
            </Button>
          </div>
        </form>
      )}
    </div>
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
