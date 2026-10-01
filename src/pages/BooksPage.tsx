import { useEffect, useState } from 'react'
import { booksApi, getErrorMessage, type BookDTO } from '../api'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { Input } from '../components/Input'
import BookDetailPage from './BookDetailPage'

export default function BooksPage() {
  const [books, setBooks] = useState<BookDTO[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    const term = search.trim()
    booksApi
      .list(term ? { search: term } : undefined)
      .then((data) => {
        setBooks(data)
        setError(null)
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [search])

  // El listado conserva la búsqueda al volver del detalle
  if (selectedId !== null) return <BookDetailPage bookId={selectedId} onBack={() => setSelectedId(null)} />

  return (
    <section className="space-y-4">
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por título o autor..."
        className="w-full"
      />

      {error && <Alert>{error}</Alert>}
      {loading && <p className="text-slate-500">Cargando...</p>}

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {books.map((book) => (
          <li key={book.id}>
            <button
              onClick={() => setSelectedId(book.id)}
              className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{book.title}</p>
                <p className="text-sm text-slate-500">{book.authors}</p>
              </div>
              <Badge color={book.availableCopies > 0 ? 'green' : 'gray'}>
                {book.availableCopies} disponibles
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
