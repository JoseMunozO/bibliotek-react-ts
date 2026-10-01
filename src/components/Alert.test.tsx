import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Alert from './Alert'
import Loading from './Loading'
import Stars from './Stars'

describe('Alert', () => {
  it('los errores son role="alert" y las confirmaciones role="status"', () => {
    render(
      <>
        <Alert message="No quedan ejemplares disponibles." />
        <Alert type="success" message="Préstamo creado." />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No quedan ejemplares disponibles.')
    expect(screen.getByRole('status')).toHaveTextContent('Préstamo creado.')
  })

  it('la región existe aunque no haya mensaje, para que el mensaje que llegue después se anuncie', () => {
    const { rerender } = render(<Alert message={null} />)
    const region = screen.getByRole('alert')
    expect(region).toBeEmptyDOMElement()
    expect(region).toHaveClass('sr-only')

    rerender(<Alert message="Libro no encontrado." />)
    // Es el mismo nodo: solo cambia su contenido
    expect(screen.getByRole('alert')).toBe(region)
    expect(region).toHaveTextContent('Libro no encontrado.')
    expect(region).not.toHaveClass('sr-only')
  })
})

describe('Loading', () => {
  it('se anuncia como estado', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
  })
})

describe('Stars', () => {
  it('en modo lectura se anuncia la puntuación como texto', () => {
    render(<Stars rating={3.75} />)
    expect(screen.getByRole('img', { name: '3,8 de 5 estrellas' })).toBeInTheDocument()
  })

  it('en el selector indica qué puntuación está elegida', () => {
    render(<Stars rating={4} onChange={() => {}} />)
    const group = screen.getByRole('group', { name: 'Puntuación' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4 estrellas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '1 estrella' })).toHaveAttribute('aria-pressed', 'false')
  })
})
