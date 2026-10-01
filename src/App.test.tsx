import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { json, mockFetch } from './test/fetch'
import { renderApp } from './test/render'

const member = {
  id: 3,
  firstName: 'Oliver',
  lastName: 'Turner',
  fullName: 'Oliver Turner',
  email: 'oliver@example.test',
  membershipType: 'standard',
  status: 'active',
}

beforeEach(() => {
  // Un socio concreto y listas vacías para todo lo demás
  mockFetch((url) => (url === '/api/members/3' ? json(member) : json([])))
})

const tabs = () =>
  within(screen.getByRole('navigation'))
    .getAllByRole('link')
    .map((link) => link.textContent)

const location = () => screen.getByTestId('location').textContent

describe('rutas', () => {
  it('redirige la raíz a /libros', async () => {
    renderApp('/')
    expect(await screen.findByPlaceholderText('Buscar por título o autor...')).toBeInTheDocument()
    expect(location()).toBe('/libros')
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderApp('/esto/no/existe')
    expect(screen.getByText('Esta página no existe.')).toBeInTheDocument()
  })

  it('muestra 404 para un id de libro no válido sin llamar a la API', () => {
    const fetchMock = mockFetch(() => json([]))
    renderApp('/libros/abc', { role: 'admin' })
    expect(screen.getByText('Ese libro no existe.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith('/api/books/'))).toBe(false)
  })
})

describe('roles', () => {
  it('Administrador: ve todas las pestañas de gestión y puede editar socios', async () => {
    renderApp('/socios/3/editar', { role: 'admin' })

    expect(tabs()).toEqual(['Libros', 'Más prestados', 'Socios', 'Préstamos', 'Notificaciones'])
    expect(await screen.findByDisplayValue('Oliver')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de membresía')).toBeEnabled()
    expect(location()).toBe('/socios/3/editar')
  })

  it('Bibliotecario: no puede editar socios y se le redirige a /libros', () => {
    renderApp('/socios/3/editar', { role: 'librarian' })

    expect(tabs()).toEqual(['Libros', 'Más prestados', 'Socios', 'Préstamos', 'Notificaciones'])
    expect(location()).toBe('/libros')
  })

  it('Socio: solo ve sus pestañas y no puede entrar en préstamos', () => {
    renderApp('/prestamos', { role: 'user', memberId: 3 })

    expect(tabs()).toEqual(['Libros', 'Más prestados', 'Mi cuenta'])
    expect(location()).toBe('/libros')
  })

  it('Socio: edita su cuenta sin poder cambiar el tipo de membresía', async () => {
    renderApp('/mi-cuenta/editar', { role: 'user', memberId: 3 })

    expect(await screen.findByDisplayValue('Oliver')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de membresía')).toBeDisabled()
    expect(screen.getByRole('button', { name: '← Volver a mi cuenta' })).toBeInTheDocument()
  })

  it('Socio sin elegir: pide que se identifique', () => {
    renderApp('/mi-cuenta', { role: 'user' })
    expect(screen.getByText(/Elige quién eres/)).toBeInTheDocument()
  })
})
