import { useState, type FormEvent } from 'react'
import { getErrorMessage, type MemberDTO } from '../api'
import { useCreateMember } from '../api/queries'
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
  const createMember = useCreateMember()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setError(null)
    try {
      const member = await createMember.mutateAsync(form)
      setForm(empty)
      onCreated(member)
    } catch (err) {
      setError(getErrorMessage(err))
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
      <Button type="submit" disabled={createMember.isPending}>
        {createMember.isPending ? 'Sparar …' : 'Skapa medlem'}
      </Button>
    </form>
  )
}
