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
  // El rol Socio siempre reseña como el socio elegido en la cabecera
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
      setError('Elige una puntuación de 1 a 5 estrellas')
      return
    }
    // Vaciar los avisos antes de enviar: así un mismo error repetido se vuelve a anunciar
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await booksApi.addReview(bookId, { memberId: Number(memberId), rating, comment })
      setRating(0)
      setComment('')
      setError(null)
      setSuccess('Reseña publicada. ¡Gracias por tu opinión!')
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
        Elige quién eres en la cabecera para escribir una reseña.
      </p>
    )

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h3 className="font-medium text-ink">Escribir una reseña</h3>
      <p className="text-xs text-muted">Solo pueden opinar los socios que ya han devuelto este libro.</p>
      <div className="flex flex-wrap items-center gap-3">
        {session.can.reviewAsAnyMember && (
          <Select required value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
            <option value="">Socio...</option>
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
        placeholder="¿Qué te ha parecido?"
        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <Alert message={error} />
      <Alert type="success" message={success} />
      <Button type="submit" disabled={saving}>
        {saving ? 'Enviando...' : 'Publicar reseña'}
      </Button>
    </form>
  )
}
