import { pageWindow } from '../utils'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const base = 'min-w-9 rounded-lg px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40'

/** Navigering mellan sidor; visas inte om det bara finns en */
export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Sidnavigering" className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Föregående sida"
        className={`${base} text-ink-soft hover:bg-surface-alt`}
      >
        ← <span className="hidden sm:inline">Föregående</span>
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Sida ${p}`}
            className={`${base} ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'text-ink-soft hover:bg-surface-alt'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Nästa sida"
        className={`${base} text-ink-soft hover:bg-surface-alt`}
      >
        <span className="hidden sm:inline">Nästa</span> →
      </button>
    </nav>
  )
}
