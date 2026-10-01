interface Props {
  rating: number
  /** Si se pasa, las estrellas son clicables para elegir la puntuación */
  onChange?: (rating: number) => void
}

export default function Stars({ rating, onChange }: Props) {
  return (
    <span className="inline-flex" aria-label={`${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((value) => {
        const star = (
          <span className={value <= Math.round(rating) ? 'text-amber-400' : 'text-slate-300'}>★</span>
        )
        return onChange ? (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="text-2xl leading-none"
            aria-label={`${value} estrellas`}
          >
            {star}
          </button>
        ) : (
          <span key={value}>{star}</span>
        )
      })}
    </span>
  )
}
