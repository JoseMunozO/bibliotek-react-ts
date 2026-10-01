import { useEffect, useState } from 'react'
import { booksApi, getErrorMessage, type BookStatisticsDTO } from '../api'
import Alert from '../components/Alert'
import { Select } from '../components/Input'
import BookDetailPage from './BookDetailPage'

const limits = [5, 10, 20, 50]

export default function MostBorrowedPage() {
  const [stats, setStats] = useState<BookStatisticsDTO[]>([])
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    booksApi
      .mostBorrowed(limit)
      .then((data) => {
        setStats(data)
        setError(null)
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [limit])

  if (selectedId !== null) return <BookDetailPage bookId={selectedId} onBack={() => setSelectedId(null)} />

  const max = Math.max(1, ...stats.map((s) => s.loanCount))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Libros más prestados</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Mostrar
          <Select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {limits.map((l) => (
              <option key={l} value={l}>
                Top {l}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && <p className="text-slate-500">Cargando...</p>}
      {!loading && !error && stats.length === 0 && (
        <p className="text-sm text-slate-500">Todavía no hay préstamos registrados.</p>
      )}

      {stats.length > 0 && (
        <ol className="rounded-lg border border-slate-200 bg-white p-2">
          {stats.map((s, index) => (
            <li key={s.bookId}>
              <button
                onClick={() => setSelectedId(s.bookId)}
                title={`${s.title}: ${s.loanCount} ${s.loanCount === 1 ? 'préstamo' : 'préstamos'}`}
                className="grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 sm:grid-cols-[2rem_minmax(0,16rem)_minmax(0,1fr)]"
              >
                <span className="text-sm text-slate-400 tabular-nums">{index + 1}</span>
                <span className="truncate text-sm font-medium text-slate-900">{s.title}</span>
                <span className="col-start-2 mt-1 flex items-center gap-2 sm:col-start-3 sm:mt-0">
                  <span className="h-2.5 flex-1">
                    <span
                      className="block h-full rounded-r bg-indigo-500"
                      style={{ width: `${(s.loanCount / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-sm text-slate-600 tabular-nums">{s.loanCount}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
