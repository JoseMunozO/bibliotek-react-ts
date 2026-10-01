interface Props {
  rating: number
  /** Si se pasa, las estrellas son clicables para elegir la puntuación */
  onChange?: (rating: number) => void
}

const values = [1, 2, 3, 4, 5]

export default function Stars({ rating, onChange }: Props) {
  const star = (value: number) => (
    <span aria-hidden="true" className={value <= Math.round(rating) ? 'text-amber-400' : 'text-faint'}>
      ★
    </span>
  )

  // Solo lectura: una imagen con la puntuación como texto ("3,8 de 5 estrellas")
  if (!onChange)
    return (
      <span role="img" aria-label={`${rating.toLocaleString('es', { maximumFractionDigits: 1 })} de 5 estrellas`} className="inline-flex">
        {values.map((value) => (
          <span key={value}>{star(value)}</span>
        ))}
      </span>
    )

  // Selector: cada botón anuncia si es la puntuación elegida (aria-pressed)
  return (
    <span role="group" aria-label="Puntuación" className="inline-flex">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={value === rating}
          aria-label={value === 1 ? '1 estrella' : `${value} estrellas`}
          className="text-2xl leading-none"
        >
          {star(value)}
        </button>
      ))}
    </span>
  )
}
