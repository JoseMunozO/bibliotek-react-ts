import { pageWindow } from '../utils'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const base = 'min-w-9 rounded-lg px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40'

/** Navegación entre páginas; no se muestra si solo hay una */
export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={`${base} text-ink-soft hover:bg-surface-alt`}
      >
        ← <span className="hidden sm:inline">Anterior</span>
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
            aria-label={`Página ${p}`}
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
        aria-label="Página siguiente"
        className={`${base} text-ink-soft hover:bg-surface-alt`}
      >
        <span className="hidden sm:inline">Siguiente</span> →
      </button>
    </nav>
  )
}
