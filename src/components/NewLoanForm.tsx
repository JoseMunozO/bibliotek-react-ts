import { useEffect, useState, type FormEvent } from 'react'
import { booksApi, getErrorMessage, loansApi, membersApi, type BookDTO, type MemberDTO } from '../api'
import Alert from './Alert'
import Button from './Button'
import { Select } from './Input'

interface Props {
  onCreated: () => void
}

export default function NewLoanForm({ onCreated }: Props) {
  const [members, setMembers] = useState<MemberDTO[]>([])
  const [books, setBooks] = useState<BookDTO[]>([])
  const [memberId, setMemberId] = useState('')
  const [bookId, setBookId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function loadOptions() {
    Promise.all([membersApi.list(), booksApi.list({ available: true })])
      .then(([members, books]) => {
        setMembers(members.filter((m) => m.status === 'active'))
        setBooks(books)
      })
      .catch((e) => setError(getErrorMessage(e)))
  }

  useEffect(loadOptions, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Vaciar los avisos antes de enviar: así un mismo error repetido se vuelve a anunciar
    setError(null)
    setSaving(true)
    try {
      await loansApi.create({ memberId: Number(memberId), bookId: Number(bookId) })
      setBookId('')
      setError(null)
      loadOptions()
      onCreated()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-medium text-slate-900">Nuevo préstamo</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select required value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Socio...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>
        <Select required value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">Libro disponible...</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} ({b.availableCopies})
            </option>
          ))}
        </Select>
      </div>
      <Alert message={error} />
      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Prestar (14 días)'}
      </Button>
    </form>
  )
}
