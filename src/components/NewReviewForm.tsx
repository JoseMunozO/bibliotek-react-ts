import { useEffect, useState, type FormEvent } from 'react'
import { booksApi, getErrorMessage, membersApi, type MemberDTO } from '../api'
import Alert from './Alert'
import Button from './Button'
import { Select } from './Input'
import Stars from './Stars'
import { useSession } from '../session'

interface Props {
  bookId: number
  onCreated: () => void
}

export default function NewReviewForm({ bookId, onCreated }: Props) {
  const session = useSession()
  const [members, setMembers] = useState<MemberDTO[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  // Rollen Medlem recenserar alltid som medlemmen som valts i sidhuvudet
  const memberId = session.can.reviewAsAnyMember ? selectedMemberId : String(session.memberId ?? '')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session.can.reviewAsAnyMember) return
    membersApi
      .list()
      .then(setMembers)
      .catch((e) => setError(getErrorMessage(e)))
  }, [session.can.reviewAsAnyMember])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setSuccess(null)
      setError('Välj ett betyg från 1 till 5 stjärnor')
      return
    }
    // Töm meddelandena innan något skickas: då läses samma fel upp igen om det upprepas
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await booksApi.addReview(bookId, { memberId: Number(memberId), rating, comment })
      setRating(0)
      setComment('')
      setError(null)
      setSuccess('Recensionen har publicerats. Tack för din åsikt!')
      onCreated()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!memberId && !session.can.reviewAsAnyMember)
    return (
      <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
        Välj vem du är i sidhuvudet för att skriva en recension.
      </p>
    )

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h3 className="font-medium text-ink">Skriv en recension</h3>
      <p className="text-xs text-muted">Endast medlemmar som har lämnat tillbaka boken kan recensera den.</p>
      <div className="flex flex-wrap items-center gap-3">
        {session.can.reviewAsAnyMember && (
          <Select required value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
            <option value="">Medlem …</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </Select>
        )}
        <Stars rating={rating} onChange={setRating} />
      </div>
      <textarea
        required
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Vad tyckte du?"
        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <Alert message={error} />
      <Alert type="success" message={success} />
      <Button type="submit" disabled={saving}>
        {saving ? 'Skickar …' : 'Publicera recension'}
      </Button>
    </form>
  )
}
