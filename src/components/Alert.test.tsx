import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Alert from './Alert'
import Loading from './Loading'
import Stars from './Stars'

describe('Alert', () => {
  it('fel är role="alert" och bekräftelser role="status"', () => {
    render(
      <>
        <Alert message="Det finns inga lediga exemplar kvar." />
        <Alert type="success" message="Lånet har skapats." />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Det finns inga lediga exemplar kvar.')
    expect(screen.getByRole('status')).toHaveTextContent('Lånet har skapats.')
  })

  it('regionen finns även utan meddelande, så att ett senare meddelande läses upp', () => {
    const { rerender } = render(<Alert message={null} />)
    const region = screen.getByRole('alert')
    expect(region).toBeEmptyDOMElement()
    expect(region).toHaveClass('sr-only')

    rerender(<Alert message="Boken hittades inte." />)
    // Det är samma nod: bara innehållet ändras
    expect(screen.getByRole('alert')).toBe(region)
    expect(region).toHaveTextContent('Boken hittades inte.')
    expect(region).not.toHaveClass('sr-only')
  })
})

describe('Loading', () => {
  it('läses upp som status', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Laddar …')
  })
})

describe('Stars', () => {
  it('i läsläge läses betyget upp som text', () => {
    render(<Stars rating={3.75} />)
    expect(screen.getByRole('img', { name: '3,8 av 5 stjärnor' })).toBeInTheDocument()
  })

  it('i väljaren anges vilket betyg som är valt', () => {
    render(<Stars rating={4} onChange={() => {}} />)
    const group = screen.getByRole('group', { name: 'Betyg' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4 stjärnor' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '1 stjärna' })).toHaveAttribute('aria-pressed', 'false')
  })
})
