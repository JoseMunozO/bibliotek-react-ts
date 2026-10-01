import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '../session'
import { json, mockFetch } from '../test/fetch'
import { renderWithSession } from '../test/render'
import MemberDetail from './MemberDetail'

const profile = {
  id: 3,
  firstName: 'Oliver',
  lastName: 'Turner',
  fullName: 'Oliver Turner',
  email: 'oliver@example.test',
  membershipDate: '2022-01-10',
  membershipType: 'premium',
  status: 'active',
  activeLoansCount: 0,
  totalLoansCount: 2,
  totalFinesCount: 1,
  unpaidFineAmount: 6,
}
const fine = { id: 38, loanId: 9, bookTitle: 'Dark River Undone', amount: 6, issuedDate: '2024-02-01', paidDate: null, status: 'pending' }

let fetchMock: ReturnType<typeof mockFetch>
let finePaid: boolean

beforeEach(() => {
  finePaid = false
  fetchMock = mockFetch((url, init) => {
    if (init?.method === 'POST' && url === '/api/members/3/fines/38/pay') {
      finePaid = true
      return json({ ...fine, status: 'paid', paidDate: '2026-10-01' })
    }
    if (url === '/api/members/3') return json(finePaid ? { ...profile, unpaidFineAmount: 0 } : profile)
    if (url === '/api/members/3/fines') return json([finePaid ? { ...fine, status: 'paid', paidDate: '2026-10-01' } : fine])
    return json([])
  })
})

const renderAs = (role: Role, onEdit?: () => void) =>
  renderWithSession(<MemberDetail memberId={3} onChange={vi.fn()} onEdit={onEdit} />, role, 3)

describe('MemberDetail', () => {
  it('muestra el perfil con etiquetas en español', async () => {
    renderAs('admin')
    expect(await screen.findByText('Oliver Turner')).toBeInTheDocument()
    expect(screen.getByText(/socio desde 2022-01-10 · Premium/)).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('6.00')).toBeInTheDocument()
  })

  it.each<[Role, { suspend: boolean; pay: boolean }]>([
    ['admin', { suspend: true, pay: true }],
    ['librarian', { suspend: false, pay: true }],
    ['user', { suspend: false, pay: false }],
  ])('%s: botones según sus permisos', async (role, expected) => {
    renderAs(role)
    await screen.findByText('Oliver Turner')

    expect(!!screen.queryByRole('button', { name: 'Suspender' })).toBe(expected.suspend)
    expect(!!screen.queryByRole('button', { name: 'Pagar' })).toBe(expected.pay)
    if (!expected.pay) expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('solo muestra Editar si se le pasa onEdit', async () => {
    const onEdit = vi.fn()
    const { unmount } = renderAs('librarian')
    await screen.findByText('Oliver Turner')
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    unmount()

    renderAs('admin', onEdit)
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('al pagar una multa recarga la ficha', async () => {
    const user = userEvent.setup()
    renderAs('librarian')

    await user.click(await screen.findByRole('button', { name: 'Pagar' }))

    expect(await screen.findByText('Pagada 2026-10-01')).toBeInTheDocument()
    expect(screen.getByText('0.00')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/members/3/fines/38/pay', expect.objectContaining({ method: 'POST' }))
  })
})
