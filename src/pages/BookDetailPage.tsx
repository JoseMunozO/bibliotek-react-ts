import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { booksApi, getErrorMessage, type BookDetailsDTO, type ReviewDTO } from '../api'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import Badge from '../components/Badge'
import Button from '../components/Button'
import NewReviewForm from '../components/NewReviewForm'
import Stars from '../components/Stars'
import { parseId, useGoBack } from '../navigation'
import NotFoundPage from './NotFoundPage'

const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/** Ruta /libros/:id */
export default function BookDetailPage() {
  const bookId = parseId(useParams().id)
  if (bookId === null) return <NotFoundPage message="Ese libro no existe." />
  // key: al pasar de un libro a otro se empieza con el estado limpio
  return <BookDetail key={bookId} bookId={bookId} />
}

function BookDetail({ bookId }: { bookId: number }) {
  const goBack = useGoBack('/libros')
  const [book, setBook] = useState<BookDetailsDTO | null>(null)
  const [reviews, setReviews] = useState<ReviewDTO[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadReviews = useCallback(() => {
    booksApi
      .reviews(bookId)
      .then(setReviews)
      .catch((e) => setError(getErrorMessage(e)))
  }, [bookId])

  useEffect(() => {
    booksApi
      .get(bookId)
      .then(setBook)
      .catch((e) => setError(getErrorMessage(e)))
    loadReviews()
  }, [bookId, loadReviews])

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <div className="space-y-6">
      <Button variant="secondary" onClick={goBack}>
        ← Volver
      </Button>

      <Alert message={error} />
      {!book && !error && <Loading />}

      {book && (
        <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{book.title}</h2>
              <p className="text-slate-600">{splitList(book.authors).join(', ')}</p>
            </div>
            <Badge color={book.availableCopies > 0 ? 'green' : 'gray'}>
              {book.availableCopies} de {book.totalCopies} disponibles
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {splitList(book.categories).map((category) => (
              <Badge key={category}>{category}</Badge>
            ))}
          </div>

          {book.summary && <p className="leading-relaxed text-slate-700">{book.summary}</p>}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Info label="ISBN" value={book.isbn} />
            <Info label="Año" value={book.yearPublished} />
            <Info label="Idioma" value={book.language} />
            <Info label="Páginas" value={book.pageCount ?? '—'} />
          </dl>
        </article>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Reseñas ({reviews.length})</h2>
          {reviews.length > 0 && (
            <span className="flex items-center gap-1 text-sm text-slate-600">
              <Stars rating={average} /> {average.toFixed(1)}
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay reseñas de este libro.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{review.memberName}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Stars rating={review.rating} /> {review.reviewDate}
                  </span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}

        {book && <NewReviewForm bookId={bookId} onCreated={loadReviews} />}
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  )
}
