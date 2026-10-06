interface Props {
  rating: number
  /** Om den skickas med går det att klicka på stjärnorna för att välja betyg */
  onChange?: (rating: number) => void
}

const values = [1, 2, 3, 4, 5]

export default function Stars({ rating, onChange }: Props) {
  const star = (value: number) => (
    <span aria-hidden="true" className={value <= Math.round(rating) ? 'text-amber-400' : 'text-faint'}>
      ★
    </span>
  )

  // Endast läsning: en bild med betyget som text ("3,8 av 5 stjärnor")
  if (!onChange)
    return (
      <span role="img" aria-label={`${rating.toLocaleString('sv', { maximumFractionDigits: 1 })} av 5 stjärnor`} className="inline-flex">
        {values.map((value) => (
          <span key={value}>{star(value)}</span>
        ))}
      </span>
    )

  // Väljare: varje knapp anger om den är det valda betyget (aria-pressed)
  return (
    <span role="group" aria-label="Betyg" className="inline-flex">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={value === rating}
          aria-label={value === 1 ? '1 stjärna' : `${value} stjärnor`}
          className="text-2xl leading-none"
        >
          {star(value)}
        </button>
      ))}
    </span>
  )
}
