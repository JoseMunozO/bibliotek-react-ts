import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getErrorMessage, type MemberDTO } from '../api'
import { bookQueries, firstError, memberQueries, useCreateLoan } from '../api/queries'
import Alert from './Alert'
import Button from './Button'
import { Select } from './Input'

interface Props {
  onCreated: () => void
}

const activeMembers = (members: MemberDTO[]) => members.filter((m) => m.status === 'active')

export default function NewLoanForm({ onCreated }: Props) {
  // Listorna laddas om av sig själva när ett lån skapas eller lämnas tillbaka
  const membersQuery = useQuery({ ...memberQueries.list(), select: activeMembers })
  const booksQuery = useQuery(bookQueries.list({ available: true }))
  const members = membersQuery.data ?? []
  const books = booksQuery.data ?? []
  const createLoan = useCreateLoan()
  const [memberId, setMemberId] = useState('')
  const [bookId, setBookId] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const error = submitError ?? firstError(membersQuery.error, booksQuery.error)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setSubmitError(null)
    try {
      await createLoan.mutateAsync({ memberId: Number(memberId), bookId: Number(bookId) })
      setBookId('')
      onCreated()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-medium text-ink">Nytt lån</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select required value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Medlem …</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>
        <Select required value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">Ledig bok …</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} ({b.availableCopies})
            </option>
          ))}
        </Select>
      </div>
      <Alert message={error} />
      <Button type="submit" disabled={createLoan.isPending}>
        {createLoan.isPending ? 'Sparar …' : 'Låna ut (14 dagar)'}
      </Button>
    </form>
  )
}
