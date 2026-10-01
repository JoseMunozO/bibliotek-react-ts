import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { booksApi, getErrorMessage, type BookDTO } from '../api'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { Input } from '../components/Input'

export default function BooksPage() {
  const [books, setBooks] = useState<BookDTO[]>([])
  // La búsqueda vive en la URL (?q=) para conservarla al volver del detalle
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const term = search.trim()
    // Ignora respuestas de búsquedas anteriores que lleguen tarde
    let current = true
    booksApi
      .list(term ? { search: term } : undefined)
      .then((data) => {
        if (!current) return
        setBooks(data)
        setError(null)
      })
      .catch((e) => current && setError(getErrorMessage(e)))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
  }, [search])

  return (
    <section className="space-y-4">
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        placeholder="Buscar por título o autor..."
        className="w-full"
      />

      {error && <Alert>{error}</Alert>}
      {loading && <p className="text-slate-500">Cargando...</p>}

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {books.map((book) => (
          <li key={book.id}>
            <Link
              to={`/libros/${book.id}`}
              className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{book.title}</p>
                <p className="text-sm text-slate-500">{book.authors}</p>
              </div>
              <Badge color={book.availableCopies > 0 ? 'green' : 'gray'}>
                {book.availableCopies} disponibles
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
