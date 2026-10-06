import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { booksApi, getErrorMessage, type BookDTO } from '../api'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import Badge from '../components/Badge'
import { Input, Select } from '../components/Input'
import Pagination from '../components/Pagination'
import { bookOrderLabel, isBookOrder, paginate, sortBooks, type BookOrder } from '../utils'

const PAGE_SIZE = 20

/**
 * API:t kan inte kombinera search, available och sort, så sökningen görs på servern
 * och filtret och sorteringen i webbläsaren (GET /books har ingen sidindelning).
 * Sidindelningen är också lokal. Allt ligger i URL:en (?q=&tillgangliga=1&sortering=&sida=)
 * så att det finns kvar när man kommer tillbaka från detaljsidan.
 */
export default function BooksPage() {
  const [books, setBooks] = useState<BookDTO[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const onlyAvailable = searchParams.get('tillgangliga') === '1'
  const orderParam = searchParams.get('sortering')
  const order: BookOrder = isBookOrder(orderParam) ? orderParam : 'titel'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  /** Ändrar ett filter i URL:en, behåller de andra och går tillbaka till första sidan */
  function setParam(key: string, value: string | null) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        next.delete('sida')
        return next
      },
      { replace: true },
    )
  }

  /** Varje sida är en post i historiken: "bakåt" går till föregående sida */
  function goToPage(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (page > 1) next.set('sida', String(page))
      else next.delete('sida')
      return next
    })
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const term = search.trim()
    // Ignorerar svar från tidigare sökningar som kommer för sent
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

  const visible = useMemo(
    () => sortBooks(onlyAvailable ? books.filter((b) => b.availableCopies > 0) : books, order),
    [books, onlyAvailable, order],
  )
  const { items: pageBooks, page, totalPages, start } = paginate(visible, Number(searchParams.get('sida')), PAGE_SIZE)
  const total =
    visible.length === books.length
      ? `${books.length} ${books.length === 1 ? 'bok' : 'böcker'}`
      : `${visible.length} av ${books.length} böcker`

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Sök på titel eller författare …"
          aria-label="Sök böcker"
          className="min-w-0 flex-1 basis-64"
        />
        <Select
          value={order}
          onChange={(e) => setParam('sortering', e.target.value === 'titel' ? null : e.target.value)}
          aria-label="Sortera efter"
        >
          {(Object.keys(bookOrderLabel) as BookOrder[]).map((o) => (
            <option key={o} value={o}>
              {bookOrderLabel[o]}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setParam('tillgangliga', e.target.checked ? '1' : null)}
          />
          Endast lediga
        </label>
      </div>

      <Alert message={error} />
      {loading && <Loading />}

      {!loading && !error && (
        <p className="text-sm text-muted" aria-live="polite">
          {totalPages > 1 ? `${start + 1}–${start + pageBooks.length} · ${total}` : total}
        </p>
      )}

      {!loading && !error && visible.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          {onlyAvailable && books.length > 0
            ? 'Ingen av de här böckerna har lediga exemplar.'
            : 'Inga böcker matchar sökningen.'}
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {pageBooks.map((book) => (
            <li key={book.id}>
              <Link
                to={`/bocker/${book.id}`}
                className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-surface-alt"
              >
                <div>
                  <p className="font-medium text-ink">{book.title}</p>
                  <p className="text-sm text-muted">{book.authors}</p>
                </div>
                <Badge color={book.availableCopies > 0 ? 'green' : 'gray'}>
                  {book.availableCopies} {book.availableCopies === 1 ? 'ledig' : 'lediga'}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
    </section>
  )
}
