import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { getErrorMessage, membersApi, type MembershipType, type UpdateMemberRequest } from '../api'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { Input, Select } from '../components/Input'
import { membershipTypeLabel } from '../utils'

interface Props {
  memberId: number
  onBack: () => void
  onSaved: () => void
}

export default function EditMemberPage({ memberId, onBack, onSaved }: Props) {
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
        ← Volver a socios
      </Button>

      {!form && !error && <p className="text-slate-500">Cargando...</p>}
      {!form && error && <Alert>{error}</Alert>}

      {form && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Editar socio</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full"
              />
            </Field>
            <Field label="Apellidos">
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full"
              />
            </Field>
          </div>

          <Field label="Email">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full"
            />
          </Field>

          <Field label="Tipo de membresía">
            <Select
              value={form.membershipType}
              onChange={(e) => setForm({ ...form, membershipType: e.target.value as MembershipType })}
              className="w-full"
            >
              {(Object.keys(membershipTypeLabel) as MembershipType[]).map((type) => (
                <option key={type} value={type}>
                  {membershipTypeLabel[type]}
                </option>
              ))}
            </Select>
          </Field>

          {error && <Alert>{error}</Alert>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="secondary" onClick={onBack}>
              Cancelar
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
