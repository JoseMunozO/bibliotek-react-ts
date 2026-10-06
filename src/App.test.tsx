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
  // En bestämd medlem och tomma listor för allt annat
  mockFetch((url) => (url === '/api/members/3' ? json(member) : json([])))
})

const tabs = () =>
  within(screen.getByRole('navigation'))
    .getAllByRole('link')
    .map((link) => link.textContent)

const location = () => screen.getByTestId('location').textContent

describe('sökvägar', () => {
  it('skickar roten vidare till /bocker', async () => {
    renderApp('/')
    expect(await screen.findByPlaceholderText('Sök på titel eller författare …')).toBeInTheDocument()
    expect(location()).toBe('/bocker')
  })

  it('visar en 404-sida för okända sökvägar', () => {
    renderApp('/det/har/finns/inte')
    expect(screen.getByText('Sidan finns inte.')).toBeInTheDocument()
  })

  it('visar 404 för ett ogiltigt bok-id utan att anropa API:t', () => {
    const fetchMock = mockFetch(() => json([]))
    renderApp('/bocker/abc', { role: 'admin' })
    expect(screen.getByText('Den boken finns inte.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith('/api/books/'))).toBe(false)
  })
})

describe('roller', () => {
  it('Administratör: ser alla administrationsflikar och kan redigera medlemmar', async () => {
    renderApp('/medlemmar/3/redigera', { role: 'admin' })

    expect(tabs()).toEqual(['Böcker', 'Mest utlånade', 'Medlemmar', 'Lån', 'Aviseringar'])
    expect(await screen.findByDisplayValue('Oliver')).toBeInTheDocument()
    expect(screen.getByLabelText('Medlemskapstyp')).toBeEnabled()
    expect(location()).toBe('/medlemmar/3/redigera')
  })

  it('Bibliotekarie: kan inte redigera medlemmar och skickas till /bocker', () => {
    renderApp('/medlemmar/3/redigera', { role: 'librarian' })

    expect(tabs()).toEqual(['Böcker', 'Mest utlånade', 'Medlemmar', 'Lån', 'Aviseringar'])
    expect(location()).toBe('/bocker')
  })

  it('Medlem: ser bara sina flikar och kommer inte åt lån', () => {
    renderApp('/lan', { role: 'user', memberId: 3 })

    expect(tabs()).toEqual(['Böcker', 'Mest utlånade', 'Mitt konto'])
    expect(location()).toBe('/bocker')
  })

  it('Medlem: redigerar sitt konto men kan inte ändra medlemskapstyp', async () => {
    renderApp('/mitt-konto/redigera', { role: 'user', memberId: 3 })

    expect(await screen.findByDisplayValue('Oliver')).toBeInTheDocument()
    expect(screen.getByLabelText('Medlemskapstyp')).toBeDisabled()
    expect(screen.getByRole('button', { name: '← Tillbaka till mitt konto' })).toBeInTheDocument()
  })

  it('Medlem som inte valts: ombeds välja vem man är', () => {
    renderApp('/mitt-konto', { role: 'user' })
    expect(screen.getByText(/Välj vem du är/)).toBeInTheDocument()
  })
})
