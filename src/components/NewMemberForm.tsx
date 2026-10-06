import { useState, type FormEvent } from 'react'
import { getErrorMessage, membersApi, type MemberDTO } from '../api'
import Alert from './Alert'
import Button from './Button'
import { Input } from './Input'

const empty = { firstName: '', lastName: '', email: '' }

interface Props {
  onCreated: (member: MemberDTO) => void
}

export default function NewMemberForm({ onCreated }: Props) {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setError(null)
    setSaving(true)
    try {
      const member = await membersApi.create(form)
      setForm(empty)
      setError(null)
      onCreated(member)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-medium text-ink">Ny medlem</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          required
          placeholder="Förnamn"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <Input
          required
          placeholder="Efternamn"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <Input
          required
          type="email"
          placeholder="E-post"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <Alert message={error} />
      <Button type="submit" disabled={saving}>
        {saving ? 'Sparar …' : 'Skapa medlem'}
      </Button>
    </form>
  )
}
