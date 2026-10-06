import type { ReactElement } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import SessionBar from './components/SessionBar'
import ThemeSelect from './components/ThemeSelect'
import BookDetailPage from './pages/BookDetailPage'
import BooksPage from './pages/BooksPage'
import LoansPage from './pages/LoansPage'
import MembersPage, { EditMemberRoute } from './pages/MembersPage'
import MostBorrowedPage from './pages/MostBorrowedPage'
import MyAccountPage, { EditMyAccountPage } from './pages/MyAccountPage'
import NotFoundPage from './pages/NotFoundPage'
import NotificationsPage from './pages/NotificationsPage'
import { useSession } from './session'

function App() {
  const session = useSession()
  const { can } = session
  const isUser = session.role === 'user'

  // Flikar som syns för rollen (samma fördelning som i konsolmenyn)
  const tabs = [
    { to: '/bocker', label: 'Böcker', visible: true },
    { to: '/mest-utlanade', label: 'Mest utlånade', visible: true },
    { to: '/mitt-konto', label: 'Mitt konto', visible: isUser },
    { to: '/medlemmar', label: 'Medlemmar', visible: can.viewMembers },
    { to: '/lan', label: 'Lån', visible: can.manageLoans },
    { to: '/aviseringar', label: 'Aviseringar', visible: can.manageNotifications },
  ].filter((tab) => tab.visible)

  // En sökväg som rollen inte har tillgång till skickar vidare till Böcker
  const only = (allowed: boolean, element: ReactElement) => (allowed ? element : <Navigate to="/bocker" replace />)

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <h1 className="text-xl font-semibold text-ink">Bibliotek</h1>
          <nav className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'text-ink-soft hover:bg-surface-alt'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SessionBar />
            <ThemeSelect />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route index element={<Navigate to="/bocker" replace />} />
          <Route path="bocker" element={<BooksPage />} />
          <Route path="bocker/:id" element={<BookDetailPage />} />
          <Route path="mest-utlanade" element={<MostBorrowedPage />} />
          <Route path="mitt-konto" element={only(isUser, <MyAccountPage />)} />
          <Route path="mitt-konto/redigera" element={only(isUser, <EditMyAccountPage />)} />
          <Route path="medlemmar" element={only(can.viewMembers, <MembersPage />)} />
          <Route path="medlemmar/:id" element={only(can.viewMembers, <MembersPage />)} />
          <Route path="medlemmar/:id/redigera" element={only(can.manageMembers, <EditMemberRoute />)} />
          <Route path="lan" element={only(can.manageLoans, <LoansPage />)} />
          <Route path="aviseringar" element={only(can.manageNotifications, <NotificationsPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
