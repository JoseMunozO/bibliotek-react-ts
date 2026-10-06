import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { booksApi, getErrorMessage, type BookStatisticsDTO } from '../api'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import { Select } from '../components/Input'

const limits = [5, 10, 20, 50]

export default function MostBorrowedPage() {
  const [stats, setStats] = useState<BookStatisticsDTO[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const top = Number(searchParams.get('top'))
  const limit = limits.includes(top) ? top : 10
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const max = Math.max(1, ...stats.map((s) => s.loanCount))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Libros más prestados</h2>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Mostrar
          <Select value={limit} onChange={(e) => setSearchParams({ top: e.target.value }, { replace: true })}>
            {limits.map((l) => (
              <option key={l} value={l}>
                Top {l}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <Alert message={error} />
      {loading && <Loading />}
      {!loading && !error && stats.length === 0 && (
        <p className="text-sm text-muted">Todavía no hay préstamos registrados.</p>
      )}

      {stats.length > 0 && (
        <ol className="rounded-lg border border-line bg-surface p-2">
          {stats.map((s, index) => (
            <li key={s.bookId}>
              <Link
                to={`/bocker/${s.bookId}`}
                title={`${s.title}: ${s.loanCount} ${s.loanCount === 1 ? 'préstamo' : 'préstamos'}`}
                className="grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-2 rounded-md px-2 py-2 text-left hover:bg-surface-alt sm:grid-cols-[2rem_minmax(0,16rem)_minmax(0,1fr)]"
              >
                <span className="text-sm text-muted tabular-nums">{index + 1}</span>
                <span className="truncate text-sm font-medium text-ink">{s.title}</span>
                <span className="col-start-2 mt-1 flex items-center gap-2 sm:col-start-3 sm:mt-0">
                  <span className="h-2.5 flex-1">
                    <span
                      className="block h-full rounded-r bg-indigo-500 dark:bg-indigo-400"
                      style={{ width: `${(s.loanCount / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-sm text-ink-soft tabular-nums">{s.loanCount}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
